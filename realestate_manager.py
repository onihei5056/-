"""
不動産仲介業者向け 売上・在庫・経費管理システム
起動方法: python realestate_manager.py
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import os
from datetime import date

from realestate_core import (
    init_db, get_conn, export_excel, jpy, today_str,
    SALE_TYPES, PROP_TYPES, STATUSES, EXPENSE_CATS,
)

# ─── Main Application ──────────────────────────────────────────────────────────

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("不動産管理システム")
        self.geometry("1050x700")
        self.configure(bg="#F0F4F8")
        self.resizable(True, True)

        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TNotebook",     background="#F0F4F8", tabmargins=[2, 4, 2, 0])
        style.configure("TNotebook.Tab", padding=[14, 6],
                        font=("メイリオ", 10, "bold"), background="#D0DBE8")
        style.map("TNotebook.Tab",
                  background=[("selected", "#1F497D")],
                  foreground=[("selected", "white")])
        style.configure("TFrame",    background="#F0F4F8")
        style.configure("TLabel",    background="#F0F4F8", font=("メイリオ", 10))
        style.configure("TButton",   font=("メイリオ", 10, "bold"), padding=6)
        style.configure("TEntry",    font=("メイリオ", 10))
        style.configure("TCombobox", font=("メイリオ", 10))
        style.configure("Treeview",  font=("メイリオ", 10), rowheight=24)
        style.configure("Treeview.Heading",
                        font=("メイリオ", 10, "bold"),
                        background="#1F497D", foreground="white")
        style.map("Treeview", background=[("selected", "#4472C4")])

        nb = ttk.Notebook(self)
        nb.pack(fill="both", expand=True, padx=10, pady=10)

        self.sales_tab     = SalesTab(nb, self)
        self.inventory_tab = InventoryTab(nb, self)
        self.expense_tab   = ExpenseTab(nb, self)
        self.export_tab    = ExportTab(nb, self)

        nb.add(self.sales_tab,     text="  売上管理  ")
        nb.add(self.inventory_tab, text="  物件在庫  ")
        nb.add(self.expense_tab,   text="  経費管理  ")
        nb.add(self.export_tab,    text="  Excelエクスポート  ")


# ─── Sales Tab ─────────────────────────────────────────────────────────────────

class SalesTab(ttk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        self._build()
        self.refresh()

    def _build(self):
        form = ttk.LabelFrame(self, text="  売上入力  ", padding=12)
        form.pack(fill="x", padx=12, pady=(12, 4))

        fields = [
            ("日付",          "date",  "entry"),
            ("物件名",        "pname", "entry"),
            ("種別",          "stype", "combo", SALE_TYPES),
            ("成約金額(円)",  "price", "entry"),
            ("仲介手数料(円)","fee",   "entry"),
            ("担当者",        "staff", "entry"),
            ("備考",          "memo",  "entry"),
        ]
        self.vars = {}
        cols = 4
        for idx, f in enumerate(fields):
            r, c = divmod(idx, cols)
            ttk.Label(form, text=f[0]).grid(row=r * 2,     column=c, sticky="w", padx=(8, 2), pady=(4, 0))
            if f[2] == "combo":
                v = tk.StringVar(value=f[3][0])
                w = ttk.Combobox(form, textvariable=v, values=f[3], state="readonly", width=16)
            else:
                v = tk.StringVar(value=today_str() if f[1] == "date" else "")
                w = ttk.Entry(form, textvariable=v, width=18)
            self.vars[f[1]] = v
            w.grid(row=r * 2 + 1, column=c, sticky="ew", padx=(8, 2), pady=(0, 4))
            form.columnconfigure(c, weight=1)

        btn = ttk.Frame(form)
        btn.grid(row=6, column=0, columnspan=cols, pady=(6, 0))
        ttk.Button(btn, text="登録",     command=self._add).pack(side="left", padx=4)
        ttk.Button(btn, text="クリア",   command=self._clear).pack(side="left", padx=4)
        ttk.Button(btn, text="選択削除", command=self._delete).pack(side="left", padx=4)

        lf = ttk.LabelFrame(self, text="  売上一覧  ", padding=6)
        lf.pack(fill="both", expand=True, padx=12, pady=4)

        cols_def = ("日付", "物件名", "種別", "成約金額", "仲介手数料", "担当者", "備考")
        self.tree = ttk.Treeview(lf, columns=cols_def, show="headings", height=14)
        for col, w in zip(cols_def, [90, 200, 80, 110, 110, 80, 150]):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=w,
                             anchor="w" if col in ("物件名", "備考") else "center")
        sb = ttk.Scrollbar(lf, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=sb.set)
        self.tree.pack(side="left", fill="both", expand=True)
        sb.pack(side="right", fill="y")

        self.total_lbl = ttk.Label(self, text="", font=("メイリオ", 11, "bold"))
        self.total_lbl.pack(anchor="e", padx=16, pady=(0, 8))

    def _add(self):
        d = {k: v.get().strip() for k, v in self.vars.items()}
        if not d["pname"]:
            messagebox.showwarning("入力エラー", "物件名を入力してください")
            return
        try:
            price = int(d["price"].replace(",", "").replace("¥", "")) if d["price"] else 0
            fee   = int(d["fee"].replace(",",  "").replace("¥", "")) if d["fee"]   else 0
        except ValueError:
            messagebox.showwarning("入力エラー", "金額は半角数字で入力してください")
            return
        with get_conn() as c:
            c.execute(
                "INSERT INTO sales (date,property_name,type,price,fee,staff,memo) VALUES (?,?,?,?,?,?,?)",
                (d["date"], d["pname"], d["stype"], price, fee, d["staff"], d["memo"]),
            )
        self.refresh()
        self._clear()
        messagebox.showinfo("登録完了", "売上を登録しました")

    def _clear(self):
        self.vars["date"].set(today_str())
        for k in ["pname", "price", "fee", "staff", "memo"]:
            self.vars[k].set("")
        self.vars["stype"].set(SALE_TYPES[0])

    def _delete(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("削除", "削除する行を選択してください")
            return
        if not messagebox.askyesno("確認", f"{len(sel)}件削除しますか?"):
            return
        ids = [self.tree.item(s)["tags"][0] for s in sel]
        with get_conn() as c:
            c.executemany("DELETE FROM sales WHERE id=?", [(i,) for i in ids])
        self.refresh()

    def refresh(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        total_fee = 0
        with get_conn() as c:
            rows = c.execute(
                "SELECT id,date,property_name,type,price,fee,staff,memo FROM sales ORDER BY date DESC"
            ).fetchall()
        for row in rows:
            self.tree.insert("", "end",
                values=(row[1], row[2], row[3], jpy(row[4]), jpy(row[5]), row[6] or "", row[7] or ""),
                tags=(row[0],))
            total_fee += row[5] or 0
        self.total_lbl.config(text=f"仲介手数料合計: {jpy(total_fee)}")


# ─── Inventory Tab ─────────────────────────────────────────────────────────────

class InventoryTab(ttk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        self._build()
        self.refresh()

    def _build(self):
        form = ttk.LabelFrame(self, text="  物件入力  ", padding=12)
        form.pack(fill="x", padx=12, pady=(12, 4))

        fields = [
            ("物件番号",  "pno",    "entry"),
            ("物件名",    "pname",  "entry"),
            ("種別",      "ptype",  "combo", PROP_TYPES),
            ("所在地",    "addr",   "entry"),
            ("価格(円)",  "price",  "entry"),
            ("面積(㎡)",  "area",   "entry"),
            ("間取り",    "rooms",  "entry"),
            ("状態",      "status", "combo", STATUSES),
            ("掲載日",    "ldate",  "entry"),
            ("備考",      "memo",   "entry"),
        ]
        self.vars = {}
        cols = 5
        for idx, f in enumerate(fields):
            r, c = divmod(idx, cols)
            ttk.Label(form, text=f[0]).grid(row=r * 2,     column=c, sticky="w", padx=(8, 2), pady=(4, 0))
            if f[2] == "combo":
                v = tk.StringVar(value=f[3][0])
                w = ttk.Combobox(form, textvariable=v, values=f[3], state="readonly", width=14)
            else:
                v = tk.StringVar(value=today_str() if f[1] == "ldate" else "")
                w = ttk.Entry(form, textvariable=v, width=16)
            self.vars[f[1]] = v
            w.grid(row=r * 2 + 1, column=c, sticky="ew", padx=(8, 2), pady=(0, 4))
            form.columnconfigure(c, weight=1)

        btn = ttk.Frame(form)
        btn.grid(row=6, column=0, columnspan=cols, pady=(6, 0))
        ttk.Button(btn, text="登録",     command=self._add).pack(side="left", padx=4)
        ttk.Button(btn, text="クリア",   command=self._clear).pack(side="left", padx=4)
        ttk.Button(btn, text="選択削除", command=self._delete).pack(side="left", padx=4)

        ff = ttk.Frame(self)
        ff.pack(fill="x", padx=12, pady=2)
        ttk.Label(ff, text="状態フィルター:").pack(side="left")
        self.filter_var = tk.StringVar(value="全て")
        ttk.Combobox(ff, textvariable=self.filter_var,
                     values=["全て"] + STATUSES, state="readonly", width=10).pack(side="left", padx=4)
        ttk.Button(ff, text="絞込み", command=self.refresh).pack(side="left", padx=4)

        lf = ttk.LabelFrame(self, text="  物件在庫一覧  ", padding=6)
        lf.pack(fill="both", expand=True, padx=12, pady=4)

        cols_def = ("物件番号", "物件名", "種別", "所在地", "価格", "面積", "間取り", "状態", "掲載日", "備考")
        self.tree = ttk.Treeview(lf, columns=cols_def, show="headings", height=14)
        for col, w in zip(cols_def, [70, 160, 80, 160, 100, 70, 60, 70, 90, 120]):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=w,
                             anchor="w" if col in ("物件名", "所在地", "備考") else "center")
        sb = ttk.Scrollbar(lf, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=sb.set)
        self.tree.pack(side="left", fill="both", expand=True)
        sb.pack(side="right", fill="y")

        self.count_lbl = ttk.Label(self, text="", font=("メイリオ", 10))
        self.count_lbl.pack(anchor="e", padx=16, pady=(0, 8))

    def _add(self):
        d = {k: v.get().strip() for k, v in self.vars.items()}
        if not d["pname"]:
            messagebox.showwarning("入力エラー", "物件名を入力してください")
            return
        try:
            price = int(d["price"].replace(",", "").replace("¥", "")) if d["price"] else None
            area  = float(d["area"]) if d["area"] else None
        except ValueError:
            messagebox.showwarning("入力エラー", "価格・面積の形式を確認してください")
            return
        with get_conn() as c:
            c.execute(
                "INSERT INTO inventory"
                " (property_no,property_name,type,address,price,area,rooms,status,listed_date,memo)"
                " VALUES (?,?,?,?,?,?,?,?,?,?)",
                (d["pno"], d["pname"], d["ptype"], d["addr"],
                 price, area, d["rooms"], d["status"], d["ldate"], d["memo"]),
            )
        self.refresh()
        self._clear()
        messagebox.showinfo("登録完了", "物件を登録しました")

    def _clear(self):
        self.vars["ldate"].set(today_str())
        for k in ["pno", "pname", "addr", "price", "area", "rooms", "memo"]:
            self.vars[k].set("")
        self.vars["ptype"].set(PROP_TYPES[0])
        self.vars["status"].set(STATUSES[0])

    def _delete(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("削除", "削除する行を選択してください")
            return
        if not messagebox.askyesno("確認", f"{len(sel)}件削除しますか?"):
            return
        ids = [self.tree.item(s)["tags"][0] for s in sel]
        with get_conn() as c:
            c.executemany("DELETE FROM inventory WHERE id=?", [(i,) for i in ids])
        self.refresh()

    def refresh(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        flt = self.filter_var.get() if hasattr(self, "filter_var") else "全て"
        with get_conn() as c:
            if flt == "全て":
                rows = c.execute(
                    "SELECT id,property_no,property_name,type,address,price,area,rooms,status,listed_date,memo"
                    " FROM inventory ORDER BY status, listed_date"
                ).fetchall()
            else:
                rows = c.execute(
                    "SELECT id,property_no,property_name,type,address,price,area,rooms,status,listed_date,memo"
                    " FROM inventory WHERE status=? ORDER BY listed_date",
                    (flt,),
                ).fetchall()
        for row in rows:
            tag = "sold" if row[9] == "成約済" else ("nego" if row[9] == "商談中" else "")
            self.tree.insert("", "end",
                values=(row[1] or "", row[2], row[3], row[4] or "",
                        jpy(row[5]) if row[5] else "-",
                        f"{row[6]}㎡" if row[6] and row[6] > 0 else "-",
                        row[7] or "", row[9], row[10] or "", row[11] or ""),
                tags=(row[0], tag))
        self.tree.tag_configure("sold", foreground="#888888")
        self.tree.tag_configure("nego", foreground="#C55A11")
        self.count_lbl.config(text=f"表示件数: {len(rows)}件")


# ─── Expense Tab ───────────────────────────────────────────────────────────────

class ExpenseTab(ttk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        self._build()
        self.refresh()

    def _build(self):
        form = ttk.LabelFrame(self, text="  経費入力  ", padding=12)
        form.pack(fill="x", padx=12, pady=(12, 4))

        fields = [
            ("日付",     "date",     "entry"),
            ("費目",     "category", "combo", EXPENSE_CATS),
            ("金額(円)", "amount",   "entry"),
            ("支払先",   "vendor",   "entry"),
            ("備考",     "memo",     "entry"),
        ]
        self.vars = {}
        for idx, f in enumerate(fields):
            ttk.Label(form, text=f[0]).grid(row=0, column=idx, sticky="w", padx=(8, 2), pady=(4, 0))
            if f[2] == "combo":
                v = tk.StringVar(value=f[3][0])
                w = ttk.Combobox(form, textvariable=v, values=f[3], state="readonly", width=18)
            else:
                v = tk.StringVar(value=today_str() if f[1] == "date" else "")
                w = ttk.Entry(form, textvariable=v, width=20)
            self.vars[f[1]] = v
            w.grid(row=1, column=idx, sticky="ew", padx=(8, 2), pady=(0, 4))
            form.columnconfigure(idx, weight=1)

        btn = ttk.Frame(form)
        btn.grid(row=2, column=0, columnspan=len(fields), pady=(6, 0))
        ttk.Button(btn, text="登録",     command=self._add).pack(side="left", padx=4)
        ttk.Button(btn, text="クリア",   command=self._clear).pack(side="left", padx=4)
        ttk.Button(btn, text="選択削除", command=self._delete).pack(side="left", padx=4)

        ff = ttk.Frame(self)
        ff.pack(fill="x", padx=12, pady=2)
        ttk.Label(ff, text="月フィルター(YYYY-MM):").pack(side="left")
        self.month_var = tk.StringVar(value=date.today().strftime("%Y-%m"))
        ttk.Entry(ff, textvariable=self.month_var, width=10).pack(side="left", padx=4)
        ttk.Button(ff, text="絞込み",   command=self.refresh).pack(side="left", padx=4)
        ttk.Button(ff, text="全件表示", command=self._show_all).pack(side="left", padx=4)

        lf = ttk.LabelFrame(self, text="  経費一覧  ", padding=6)
        lf.pack(fill="both", expand=True, padx=12, pady=4)

        cols_def = ("日付", "費目", "金額", "支払先", "備考")
        self.tree = ttk.Treeview(lf, columns=cols_def, show="headings", height=12)
        for col, w in zip(cols_def, [90, 130, 100, 160, 280]):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=w,
                             anchor="w" if col in ("支払先", "備考") else "center")
        sb = ttk.Scrollbar(lf, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=sb.set)
        self.tree.pack(side="left", fill="both", expand=True)
        sb.pack(side="right", fill="y")

        sf = ttk.LabelFrame(self, text="  費目別集計  ", padding=8)
        sf.pack(fill="x", padx=12, pady=(0, 8))
        self.summary_text = tk.Text(sf, height=3, font=("メイリオ", 9),
                                    state="disabled", bg="#F8F9FA", relief="flat")
        self.summary_text.pack(fill="x")

    def _add(self):
        d = {k: v.get().strip() for k, v in self.vars.items()}
        if not d["amount"]:
            messagebox.showwarning("入力エラー", "金額を入力してください")
            return
        try:
            amount = int(d["amount"].replace(",", "").replace("¥", ""))
        except ValueError:
            messagebox.showwarning("入力エラー", "金額は半角数字で入力してください")
            return
        with get_conn() as c:
            c.execute(
                "INSERT INTO expenses (date,category,amount,vendor,memo) VALUES (?,?,?,?,?)",
                (d["date"], d["category"], amount, d["vendor"], d["memo"]),
            )
        self.refresh()
        self._clear()
        messagebox.showinfo("登録完了", "経費を登録しました")

    def _clear(self):
        self.vars["date"].set(today_str())
        self.vars["amount"].set("")
        self.vars["vendor"].set("")
        self.vars["memo"].set("")
        self.vars["category"].set(EXPENSE_CATS[0])

    def _delete(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("削除", "削除する行を選択してください")
            return
        if not messagebox.askyesno("確認", f"{len(sel)}件削除しますか?"):
            return
        ids = [self.tree.item(s)["tags"][0] for s in sel]
        with get_conn() as c:
            c.executemany("DELETE FROM expenses WHERE id=?", [(i,) for i in ids])
        self.refresh()

    def _show_all(self):
        self.month_var.set("")
        self.refresh()

    def refresh(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        m = self.month_var.get().strip() if hasattr(self, "month_var") else ""
        with get_conn() as c:
            if m:
                rows = c.execute(
                    "SELECT id,date,category,amount,vendor,memo FROM expenses WHERE date LIKE ? ORDER BY date",
                    (f"{m}%",),
                ).fetchall()
                summary = c.execute(
                    "SELECT category, SUM(amount) FROM expenses WHERE date LIKE ? GROUP BY category ORDER BY 2 DESC",
                    (f"{m}%",),
                ).fetchall()
            else:
                rows = c.execute(
                    "SELECT id,date,category,amount,vendor,memo FROM expenses ORDER BY date DESC"
                ).fetchall()
                summary = c.execute(
                    "SELECT category, SUM(amount) FROM expenses GROUP BY category ORDER BY 2 DESC"
                ).fetchall()

        total = 0
        for row in rows:
            self.tree.insert("", "end",
                values=(row[1], row[2], jpy(row[3]), row[4] or "", row[5] or ""),
                tags=(row[0],))
            total += row[3] or 0

        self.summary_text.config(state="normal")
        self.summary_text.delete("1.0", "end")
        if summary:
            line = "  |  ".join(f"{cat}: {jpy(amt)}" for cat, amt in summary[:8])
            self.summary_text.insert("end", f"合計: {jpy(total)}\n{line}")
        self.summary_text.config(state="disabled")


# ─── Export Tab ────────────────────────────────────────────────────────────────

class ExportTab(ttk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        self._build()

    def _build(self):
        frame = ttk.Frame(self, padding=30)
        frame.pack(expand=True)

        ttk.Label(frame, text="Excelエクスポート",
                  font=("メイリオ", 14, "bold")).grid(row=0, column=0, columnspan=2, pady=(0, 20))

        ttk.Label(frame, text="対象月(YYYY-MM):").grid(row=1, column=0, sticky="e", padx=8, pady=8)
        self.month_var = tk.StringVar(value=date.today().strftime("%Y-%m"))
        ttk.Entry(frame, textvariable=self.month_var, width=12).grid(row=1, column=1, sticky="w")
        ttk.Label(frame, text="※空白にすると全期間").grid(row=2, column=1, sticky="w", pady=(0, 16))

        ttk.Button(frame, text="Excelファイルを保存",
                   command=self._export, width=22).grid(row=3, column=0, columnspan=2, pady=8)

        self.status_lbl = ttk.Label(frame, text="", foreground="#1F497D",
                                    font=("メイリオ", 10, "bold"))
        self.status_lbl.grid(row=4, column=0, columnspan=2, pady=12)

        ttk.Separator(frame, orient="horizontal").grid(
            row=5, column=0, columnspan=2, sticky="ew", pady=16)

        info = (
            "【出力シート】\n"
            "  売上一覧     — 日付・物件名・種別・成約金額・仲介手数料・担当者\n"
            "  物件在庫     — 物件番号・物件名・種別・所在地・価格・面積・状態\n"
            "  経費一覧     — 日付・費目・金額・支払先・備考\n"
            "  月次サマリー — 月別 仲介手数料合計 / 経費合計 / 利益（赤字は赤色表示）"
        )
        ttk.Label(frame, text=info, justify="left",
                  font=("メイリオ", 10), foreground="#444444").grid(
            row=6, column=0, columnspan=2, sticky="w")

    def _export(self):
        m = self.month_var.get().strip() or None
        default_name = f"不動産管理_{m or '全期間'}.xlsx"
        filepath = filedialog.asksaveasfilename(
            title="保存先を選択",
            defaultextension=".xlsx",
            initialfile=default_name,
            filetypes=[("Excelファイル", "*.xlsx"), ("全てのファイル", "*")],
        )
        if not filepath:
            return
        try:
            export_excel(filepath, year_month=m)
            self.status_lbl.config(
                text=f"保存しました: {os.path.basename(filepath)}", foreground="#1F497D")
            messagebox.showinfo("完了", f"Excelファイルを保存しました。\n{filepath}")
        except Exception as e:
            self.status_lbl.config(text=f"エラー: {e}", foreground="red")
            messagebox.showerror("エラー", str(e))


# ─── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    app = App()
    app.mainloop()

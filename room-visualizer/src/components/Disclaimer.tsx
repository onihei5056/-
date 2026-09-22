import { DISCLAIMER } from '../mock/options';
import { IconInfo } from '../icons';

/** 不動産会社向けの必須注意表示 */
export function Disclaimer({ plain = false }: { plain?: boolean }) {
  return (
    <p className={`disclaimer${plain ? ' plain' : ''}`}>
      <IconInfo size={14} className="ic" />
      <span>{DISCLAIMER}</span>
    </p>
  );
}

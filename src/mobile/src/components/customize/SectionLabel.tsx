import { type } from "../system";
import { Txt,useTheme } from "../ui";
import { useDesignScale } from "../useDesignScale";

/** Small grey caps heading over a group of options (12 / 900). Pass the text already in capitals. */
export function SectionLabel({ children, first = false }: { children: string; first?: boolean }) {
  const d = useDesignScale(), c = useTheme();
  return <Txt style={{ ...type("label", d), color: c.muted, marginTop: first ? 0 : d(6) }}>{children}</Txt>;
}

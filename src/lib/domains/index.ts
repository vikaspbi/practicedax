import type { Domain } from "@/lib/types";
import { salesDomain } from "./sales";
import { hrDomain } from "./hr";
import { financeDomain } from "./finance";

export const domains: Domain[] = [salesDomain, hrDomain, financeDomain];

export function getDomain(id: string): Domain | undefined {
  return domains.find((d) => d.id === id);
}

export function getTable(domain: Domain, name: string) {
  return domain.tables.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

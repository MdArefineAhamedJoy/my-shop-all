import { Check, Column, Entity } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
export const SETTINGS_ID = "00000000-0000-4000-8000-000000000001";
@Entity("store_settings")
@Check("singleton_settings", `id = '${SETTINGS_ID}'`)
@Check(
  "valid_settings",
  "shipping_minor BETWEEN 0 AND 10000000 AND free_shipping_threshold_minor BETWEEN 0 AND 100000000 AND tax_basis_points BETWEEN 0 AND 10000 AND return_window_days BETWEEN 1 AND 365",
)
export class StoreSettings extends BaseEntity {
  @Column("integer") shippingMinor: number;
  @Column("integer") freeShippingThresholdMinor: number;
  @Column("integer") taxBasisPoints: number;
  @Column("integer") returnWindowDays: number;
}

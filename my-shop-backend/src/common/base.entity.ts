import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from "typeorm";

export abstract class BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
  @VersionColumn() version: number;
}

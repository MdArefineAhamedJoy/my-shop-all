import { DefaultNamingStrategy, NamingStrategyInterface } from "typeorm";
import { snakeCase } from "typeorm/util/StringUtils";

export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(name: string, custom: string) {
    return custom || snakeCase(name);
  }
  columnName(name: string, custom: string, prefixes: string[]) {
    return snakeCase([...prefixes, custom || name].join("_"));
  }
  relationName(name: string) {
    return snakeCase(name);
  }
  joinColumnName(relation: string, column: string) {
    return snakeCase(`${relation}_${column}`);
  }
}

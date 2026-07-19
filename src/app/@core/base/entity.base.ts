export class EntityBase<Entity> {
  constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {}

  toModel(): any {
    const { ...props } = Object.assign({}, this);

    for (let [key, value] of Object.entries(props)) {
      if (value instanceof Date) {
        props[key] = value.toISOString();
      }
    }

    return {
      ...props,
    };
  }
}

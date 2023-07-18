export function copy<T>(source: T, toReplaceFields: any): T {
    verifyToReplaceFieldsExist(source, toReplaceFields);

    const result = { ...source, ...toReplaceFields };

    Object.setPrototypeOf(result, source as any);

    return result;
}

function verifyToReplaceFieldsExist(source: any, toReplaceFields: any) {
    const sourceType = source.constructor.name;

    for (const k in toReplaceFields) {
        if (!(k in source)) {
            throw new RecordsCopyError(`${k} property is not present in the ${sourceType} record`);
        }

        const requiredType = source[k].constructor.name;
        const givenType = toReplaceFields[k].constructor.name;
        if (requiredType != givenType) {
            throw new RecordsCopyError(`${sourceType} ${k} field is of ${requiredType} type, but ${givenType} was given`);
        }
    }
}

export class RecordsCopyError extends Error {
    constructor(readonly message: string) {
        super(message);
    }
}
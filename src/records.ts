export function copy<T>(source: T, toOverride: any): T {
    //TODO: check types and keys
    return {...source, ...toOverride};
}
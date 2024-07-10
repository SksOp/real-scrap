export function mergeFunction(propertyData, byrutData) {
    const mergedData = new Map();
    propertyData.forEach(element => {
        mergedData.set(element.permit_number, element);
    });

    byrutData.forEach(element => {
        mergedData.set(element.permit_number, element);
    });
    return Array.from(mergedData.values());

}
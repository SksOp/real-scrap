export function mergeFunction(propertyData, byrutData) {
    const mergedData = new Map();


    console.log("propertyData", propertyData);  
    console.log("byrutData", byrutData);
    // Normalize and add propertyData to the map
    propertyData.forEach(element => {
        const standardizedElement = {
            image: element.image,
            price: element.price,
            title: element.title,
            location: element.location,
            permitNumber: element.permitNumber
        };
        mergedData.set(standardizedElement.permitNumber, standardizedElement);
    });

    // Normalize and add byrutData to the map
    byrutData.forEach(element => {
        const standardizedElement = {
            image: element.imageURL, // Assuming byrutData uses imageURL
            price: element.price,
            title: element.title,
            location: element.location,
            permitNumber: element.permit_Number // Assuming byrutData uses permit_Number
        };
        mergedData.set(standardizedElement.permitNumber, standardizedElement);
    });

    return Array.from(mergedData.values());
}

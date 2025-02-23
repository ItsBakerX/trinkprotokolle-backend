import "jest-extended/all"; // implementation
import "jest-extended"; // declaration

const fullData = {
    arr: [
        {
            "prop1": "value1a",
            "prop2": {
                "prop3": "value2a",
                "prop4": "value2a"
            }
        },
        {
            "prop1": "value1b",
            "prop2": {
                "prop3": "value2b",
                "prop4": "value3b"
            }
        },
        {
            "prop1": "value1c",
            "prop2": {
                "prop3": "value2c",
                "prop4": "value3c"
            }
        }
    ]
}


const fullDataOtherOrder = {
    arr: [
        {
            "prop2": {
                "prop4": "value2a",
                "prop3": "value2a"
            },
            "prop1": "value1a",
        },
        {
            "prop1": "value1c",
            "prop2": {
                "prop4": "value3c",
                "prop3": "value2c"
            }
        },
        {
            "prop1": "value1b",
            "prop2": {
                "prop3": "value2b",
                "prop4": "value3b"
            }
        }
    ]
}

const fullLengthPartData = {
    arr: [
        {
            "prop1": "value1a",
            "prop2": {
                "prop3": "value2a"
            }
        },
        {
            "prop1": "value1c",
            "prop2": {
                "prop3": "value2c"
            }
        },
        {
            "prop1": "value1b",
            "prop2": {
                "prop3": "value2b"
            }
        }
    ]
}

const partLengthFullData = {
    arr: [
        {
            "prop1": "value1a",
            "prop2": {
                "prop3": "value2a",
                "prop4": "value2a"
            }
        },
        {
            "prop1": "value1b",
            "prop2": {
                "prop3": "value2b",
                "prop4": "value3b"
            }
        }
    ]
}

test('Jest toMatchObject', () => {
    expect(fullData).toMatchObject(fullData);

    expect(fullData).not.toMatchObject(fullDataOtherOrder);

    expect(fullLengthPartData).not.toMatchObject(fullData);
    expect(partLengthFullData).not.toMatchObject(fullData);
    expect(fullData).not.toMatchObject(fullLengthPartData);
    expect(fullData).not.toMatchObject(partLengthFullData);
});

test('XJest toIncludeAllMembers', () => {
    expect(fullData.arr).toIncludeAllMembers(fullData.arr);
    expect(fullData.arr).toIncludeAllMembers(partLengthFullData.arr);

    expect(fullData).not.toIncludeAllMembers(fullDataOtherOrder.arr);

    expect(fullLengthPartData.arr).not.toIncludeAllMembers(fullData.arr);
    expect(partLengthFullData.arr).not.toIncludeAllMembers(fullData.arr);
    expect(fullData.arr).not.toIncludeAllMembers(fullLengthPartData.arr);
});

test('XJest toIncludeAllPartialMembers', () => {
    expect(fullData.arr).toIncludeAllPartialMembers(fullData.arr);
    expect(fullData.arr).toIncludeAllPartialMembers(partLengthFullData.arr);

    expect(fullData).not.toIncludeAllPartialMembers(fullDataOtherOrder.arr);

    expect(fullLengthPartData.arr).not.toIncludeAllPartialMembers(fullData.arr);
    expect(partLengthFullData.arr).not.toIncludeAllPartialMembers(fullData.arr);
    expect(fullData.arr).not.toIncludeAllPartialMembers(fullLengthPartData.arr);
});

test('XJest toIncludeAnyMembers', () => {
    expect(fullData.arr).toIncludeAnyMembers(fullData.arr);
    expect(fullData.arr).toIncludeAnyMembers(partLengthFullData.arr);
    expect(partLengthFullData.arr).toIncludeAnyMembers(fullData.arr);

    expect(fullData).not.toIncludeAnyMembers(fullDataOtherOrder.arr);

    expect(fullLengthPartData.arr).not.toIncludeAnyMembers(fullData.arr);
    expect(fullData.arr).not.toIncludeAnyMembers(fullLengthPartData.arr);
});

test('XJest toIncludeSameMembers', () => {
    expect(fullData.arr).toIncludeSameMembers(fullData.arr);

    expect(fullData).not.toIncludeSameMembers(fullDataOtherOrder.arr);
    expect(fullData.arr).not.toIncludeSameMembers(partLengthFullData.arr);
    expect(partLengthFullData.arr).not.toIncludeSameMembers(fullData.arr);
    expect(fullLengthPartData.arr).not.toIncludeSameMembers(fullData.arr);
    expect(fullData.arr).not.toIncludeSameMembers(fullLengthPartData.arr);
});

test('XJest toPartiallyContain', () => {
    expect(fullData.arr).toPartiallyContain(fullData.arr[0]);
});


// for (let i = 0; i < protokolls.length; i++) {
//     const actualProtokoll = actualTriPro.protokolls.find(protokoll => protokoll.name == protokolls[i].name);
//     expect(actualProtokoll).toBeDefined()
// }


const largeData =
{
    "prop1": "value1a",
    "prop2": {
        "prop3": "value2a",
        "prop4": "value2a"
    }
}

const subsetData =
{
    "prop1": "value1a",
    "prop2": {
        "prop3": "value2a",
    }
}
const smallSubsetData =
{
    "prop1": "value1a",
}

const superSet =
{
    "prop1": "value1a",
    "prop2": {
        "prop3": "value2a",
        "prop4": "value2a"
    },
    "prop5": "value3a",
}

test('Jest toMatchObject', () => {
    expect(largeData).toMatchObject(largeData);
    expect(largeData).toMatchObject(subsetData);
    expect(largeData).toMatchObject(smallSubsetData);
    expect(largeData).not.toMatchObject(superSet);
});
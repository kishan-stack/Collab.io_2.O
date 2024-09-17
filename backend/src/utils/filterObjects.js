export const filterObjects = (Obj,...allowedObj)=>{
    const newObj = {}
    Object.keys(Obj).forEach((el)=>{
        if(allowedObj.includes(el)) newObj[el] = Obj[el];
    })
    return newObj
}
import crypto from 'crypto'

export const resetTokenHash=(token:string):string=>{
    return crypto.createHash("sha256").update(token).digest("hex")
}
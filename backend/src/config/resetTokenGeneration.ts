import crypto from 'crypto'

export const resetTokenGeneration=()=>{
    return crypto.randomBytes(32).toString("hex")
}
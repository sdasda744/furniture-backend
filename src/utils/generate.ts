import {randomBytes} from "crypto"

export const generateOtp = () => {
  // console.log(randomBytes(3).toString("hex"));
  // console.log(randomBytes(3));
  const buffer = randomBytes(3) // 24 bits
  const number = parseInt(buffer.toString("hex"), 16)
  const otp = number % 900000 + 100000
  return otp
}

export const generateToken =  () => {
  return  randomBytes(32).toString("hex")
}
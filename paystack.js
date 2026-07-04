const express = require('express')
const https = require('https')

require('dotenv').config()
const app =  express()

const options = {
  hostname: 'api.paystack.co',
  port: 443,
  path: '/transaction/initialize',
  method: 'POST',
  headers: {
    Authorization: process.env.paystack_secret_key,
    'Content-Type': 'application/json'
  }
}



const payment =(request, response)=>{
    const{email, amount}= request.body
const params = JSON.stringify({
  email: email,
  amount: amount
})

const req = https.request(options, res => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  });

  res.on('end', () => {
    console.log(JSON.parse(data))

    let info =JSON.parse(data)
    response.status(200).json({result:info})
  })
}).on('error', error => {
  console.error(error)
})

req.write(params)
req.end()

}







module.exports ={payment} 

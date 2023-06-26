import express from 'express'
import { controller } from './modules/runner.js'
const app = express()
const port = process.env.PORT || 5000

app.get('/', (req, res) => {
    try {
        res.send(`Sohbet et & Takıl! [${controller.status ? 'Online' : 'Offline'}]`)
    } catch (error) {
        console.error(error)
    }
})

app.get('/close', (req, res) => {
    try {
        controller.status = false
        res.redirect('/')
    } catch (error) {
        console.error(error)
    }
})
app.get('/open', (req, res) => {
    try {
        controller.status = true
        res.redirect('/')
    } catch (error) {
        console.error(error)
    }
})
app.listen(port, () => {
  console.log(`Web app listening on port ${port}`)
})
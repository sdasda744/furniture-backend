import { app } from "./app"
import "dotenv/config"

const PORT = process.env.PORT || 4000;

app.listen(PORT, ()=> console.log(`Server is ready at: http://localhost:${PORT}`))

const express = require('express')
const crypto = require('node:crypto')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())
app.disable('x-powered-by')

const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:1234',
  'https://movies.com',
  'https://jfelmejor6026.com'
]

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to moviesJSON' })
})

// Cada recurso se identifica con una URL, en este caso será movies
// O sea que cada recurso que sea MOVIES se identificará con /movies
app.get('/movies', (req, res) => {
  const origin = req.header('origin')
  // /* En caso de que el puerto sea el mismo, no me va a devolver la cabecera origin.
  //     * Cuando la petición es del mismo origin
  //     * http://localhost:1234 --> http://localhost:1234
  // */
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin) // Solución del CORS
  }

  // Desde la request podemos acceder a la query
  // En este ejemplo la query sería genre (http://localhost:1234/movies?genre=Action)
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  return res.status(404).json({ message: 'Movie not found' })
})
// La forma de recuperar las query se explica en este ejemplo:
/*
app.get('/movies/:hola/:chao', (req, res) => {
  const { hola, chao } = req.params
})
*/

// POST
app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  // Esto no es REST porque estamos guardando
  // El estado de la aplicación en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

// Final del POST ☝🏻

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex < 0) return res.status(404).json({ message: 'Movie not found' })

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  }

  res.send(200)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Listening on port http://localhost:${PORT}`)
})

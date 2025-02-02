import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use( express.json())
app.use(cors());
app.use(express.urlencoded({extended: true}));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "crud_app"
})

db.connect((err) => {
    if(err) {
        console.error('Error koneksi ke drabase:', err);
    } else {
        console.log('koneksi ke database berhasil!');
    }
});


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Menyimpan file dengan nama unik
    }
});

const upload = multer({storage: storage}); 

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get("/", (req, res) => {
    res.json("hello this is the backend")
})

app.get("/books", (req, res) => {
    const sql = "SELECT * FROM books";
    db.query(sql, (err, data) => {
        if (err) {
            console.error('SQL error:', err);
            return res.status(500).json(err);
        }
        return res.json(data);
    });
});

app.get('/books/:id', (req, res) => {
    const bookId = req.params.id;
    const sql = 'SELECT * FROM books WHERE id = ?';

    db.query(sql, [bookId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        if (result.length === 0) {
            return res.status(404).send('Book not found');
        }
        res.json(result[0]);
    });
});


app.post("/books", upload.single('cover_image'), (req, res) => {
    const { title, author, publisher, publication_year } = req.body; 
    const cover_image = req.file ? `${req.file.filename}` : null;
    

    console.log('Received data:', { title, author, publisher, publication_year, cover_image });

    const sql = "INSERT INTO books (title, author, publisher, publication_year, cover_image) VALUES ?";
    const VALUES = [[title, author, publisher, publication_year, cover_image ]];

    db.query(sql, [VALUES], (err, data) => {
        if(err) {
            console.error('SQL error: ', err) 
        return res.status(500).json(err)
        } 
        return res.status(201).json(data);
    }) 
})

app.delete("/books/:id", (req, res) => {
    const bookId = req.params.id;
    const sql = "DELETE FROM books WHERE id = ?"

    db.query(sql, [bookId], (err, data) => {
        if (err) return res.json(err);
        return res.json("Book has been deleted succeccfully")
    })
})



app.put('/books/:id', upload.single('cover_image'), (req, res) => {
    const bookId = req.params.id;
    const { title, author, publisher, publication_year } = req.body;
    const cover_image = req.file ? req.file.filename : req.body.cover_image;

    let sql = 'UPDATE books SET ';
    const fields = [];

    if (title) fields.push(`title = '${title}'`);
    if (author) fields.push(`author = '${author}'`);
    if (publisher) fields.push(`publisher = '${publisher}'`);
    if (publication_year) fields.push(`publication_year = ${publication_year}`);
    if (cover_image) fields.push(`cover_image = '${cover_image}'`);

    sql += fields.join(', ');
    sql += ` WHERE id = ${bookId}`;

    db.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        res.json(result);
    });
});


app.listen(5000, () => {
    console.log(`Connected to backend http://localhost:5000`);
})
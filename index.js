const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static("doctors"));
app.use(fileUpload());

const port = 3003;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pizzd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
client.connect((err) => {
	const AppointmentCollection = client
		.db("DoctorsPortal")
		.collection("appointments");
	const DoctorCollection = client
		.db("DoctorsPortal")
		.collection("doctors");
	// perform actions on the collection object
	app.post("/addAppointment", (req, res) => {
		const appointment = req.body;
		AppointmentCollection.insertOne(appointment).then((result) => {
			res.send(result.insertedCount > 0);
		});
	});

	// appointment by date:

	app.post("/appointmentsByDate", (req, res) => {
		const date = req.body.date;
		const email = req.body.email;
		DoctorCollection.find({ email: email }).toArray(
			(err, doctors) => {
				const filter = { date: date };
				if (doctors.length === 0) {
					filter.email = email;
				}

				AppointmentCollection.find(filter).toArray(
					(err, documents) => {
						res.send(documents);
					}
				);
			}
		);
	});

	// check is Doctor:

	app.post("/isDoctor", (req, res) => {
		const email = req.body.email;
		DoctorCollection.find({ email: email }).toArray(
			(err, doctors) => {
				res.send(doctors.length > 0);
			}
		);
	});

	//add doctor:

	app.post("/addDoctor", (req, res) => {
		const file = req.files.file;
		const name = req.body.name;
		const email = req.body.email;
		const photoName = file.name;
		console.log(name, email, file);

		const newImage = req.files.file.data;
		const encodeImage = newImage.toString("base64");
		const image = {
			contentType: req.files.file.mimetype,
			size: req.files.file.size,
			img: Buffer.from(encodeImage, "base64"),
		};

		DoctorCollection.insertOne({
			name,
			email,
			image,
		}).then((result) => {
			console.log(result);
		});
	});

	// Get Doctors
	app.get("/doctors", (req, res) => {
		DoctorCollection.find({}).toArray((err, documents) => {
			res.send(documents);
		});
	});
});

app.get("/", (req, res) => {
	res.send("Hello I am Working");
});

app.listen(process.env.PORT || port);

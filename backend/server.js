const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/healthcare', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define patient schema with patientId
const patientSchema = new mongoose.Schema({
  name: String,
  dateOfBirth: Date,
  phoneNumber: String,
  dateOfAppointment: Date,
  prescribedMedication: String,
  departmentOfAdmission: String,
  patientId: { type: String, unique: true }  // ✅ Ensure patientId is included
});



const Patient = mongoose.model('Patient', patientSchema);

// Generate next patient ID like P001, P002, ...
const generatePatientId = async () => {
  const lastPatient = await Patient.findOne().sort({ patientId: -1 });

  if (!lastPatient || !lastPatient.patientId) {
    return 'P001';
  }

  const lastIdNumber = parseInt(lastPatient.patientId.substring(1)) || 0;
  const newIdNumber = lastIdNumber + 1;
  return `P${String(newIdNumber).padStart(3, '0')}`;
};

// Create a patient (POST /patients)
app.post('/patients', async (req, res) => {
  try {
    const newPatientId = await generatePatientId();
    const patient = new Patient({ ...req.body, patientId: newPatientId });

    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ message: 'Failed to add patient', error: err.message });
  }
});

// Get all patients
app.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/analytics/most-prescribed-medications', async (req, res) => {
  try {
    const result = await Patient.aggregate([
      {
        $group: {
          _id: "$prescribedMedication",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/patients/visits-per-month', async (req, res) => {
  try {
    const result = await Patient.aggregate([
      {
        $group: {
          _id: { $month: '$dateOfAppointment' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          count: 1,
          month: {
            $arrayElemAt: [
              [
                '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
              ],
              '$_id'
            ]
          }
        }
      },
      {
        $sort: {
          month: 1
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/analytics/average-age-per-department', async (req, res) => {
  try {
    const result = await Patient.aggregate([
      {
        $match: {
          dateOfBirth: { $ne: null } // only patients with DOB
        }
      },
      {
        $addFields: {
          age: {
            $dateDiff: {
              startDate: "$dateOfBirth",
              endDate: "$$NOW",
              unit: "year"
            }
          }
        }
      },
      {
        $group: {
          _id: "$departmentOfAdmission",
          averageAge: { $avg: "$age" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Update a patient
app.put('/patients/:id', async (req, res) => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedPatient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a patient
app.delete('/patients/:id', async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

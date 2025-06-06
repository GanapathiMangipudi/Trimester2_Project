import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const API_URL = 'http://localhost:5000';

export default function Dashboard() {  const [activePage, setActivePage] = useState('add');

  // State for adding patients
  const [newPatient, setNewPatient] = useState({
    name: '',
    dateOfBirth: '',
    phoneNumber: '',
    dateOfAppointment: '',
    prescribedMedication: '',
    departmentOfAdmission: '',
  });

  // State for viewing/editing patients
  const [patients, setPatients] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  // Chart data
  const [medicationData, setMedicationData] = useState([]);
  const [visitsPerMonth, setVisitsPerMonth] = useState([]);

  const [averageAgeData, setAverageAgeData] = useState([]);
  



  // Fetch data for View Patients page
  useEffect(() => {
    if (activePage === 'view') {
      fetchPatients();
      fetchMedicationAnalytics();
      fetchVisitsPerMonth();
      fetchAverageAgeData();

    }
  }, [activePage]);

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_URL}/patients`);
      const data = await res.json();
      setPatients(data);
    } catch {
      alert('Failed to load patients');
    }
  };

  const fetchMedicationAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/analytics/most-prescribed-medications`);
      const data = await res.json();
      setMedicationData(data);
    } catch {
      alert('Failed to fetch medication analytics');
    }
  };

  const fetchVisitsPerMonth = async () => {
    try {
      const res = await fetch(`${API_URL}/patients/visits-per-month`);
      const data = await res.json();
      setVisitsPerMonth(data);
    } catch {
      alert('Failed to load monthly visits data');
    }
  };

  const fetchAverageAgeData = async () => {
  try {
    const res = await fetch(`${API_URL}/analytics/average-age-per-department`);
    const data = await res.json();
    console.log("Fetched averageAgeData:", data); // ADD THIS
    setAverageAgeData(data);
  } catch {
    alert('Failed to fetch average age data');
  }
};


function formatDateInput(input) {
  if (!input) return '';
  const date = new Date(input);
  if (isNaN(date)) return '';
  
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

  const handleAddChange = (e) => {
  const { name, value } = e.target;
  setNewPatient(prev => ({ ...prev, [name]: value }));
};

const handleEditChange = (e) => {
  const { name, value } = e.target;
  setEditValues(prev => ({ ...prev, [name]: value }));
};


  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(newPatient.phoneNumber)) {
      alert('Phone number must be exactly 10 or 11 digits.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });

      if (!res.ok) throw new Error();
      alert('Patient added successfully');
      setNewPatient({
        name: '',
        dateOfBirth:'',
        phoneNumber: '',
        dateOfAppointment: '',
        prescribedMedication: '',
        departmentOfAdmission: '',
      });
    } catch {
      alert('Failed to add patient');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    try {
      await fetch(`${API_URL}/patients/${id}`, { method: 'DELETE' });
      fetchPatients();
    } catch {
      alert('Delete failed');
    }
  };

const startEditing = (patient) => {
  setEditingId(patient._id);
  setEditValues({
    name: patient.name,
    dateOfBirth: patient.dateOfBirth
      ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
      : '', // fallback
    phoneNumber: patient.phoneNumber,
    dateOfAppointment: patient.dateOfAppointment
      ? new Date(patient.dateOfAppointment).toISOString().split('T')[0]
      : '',
    prescribedMedication: patient.prescribedMedication,
    departmentOfAdmission: patient.departmentOfAdmission,
  });
};



  const handleSave = async (id) => {
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(editValues.phoneNumber)) {
      alert('Phone number must be exactly 10 or 11 digits.');
      return;
    }

    try {
      await fetch(`${API_URL}/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      setEditingId(null);
      fetchPatients();
    } catch {
      alert('Failed to update patient');
    }
  };

  const medicationChartData = {
    labels: medicationData.map(item => item._id),
    datasets: [{
      label: 'Prescriptions',
      data: medicationData.map(item => item.count),
      backgroundColor: '#007bff'
    }]
  };

 const visitsChartData = {
  labels: visitsPerMonth.map(item => item.month),
  datasets: [{
    label: 'Visits',
    data: visitsPerMonth.map(item => item.count),
    backgroundColor: 'rgba(54, 162, 235, 0.6)',
    borderColor: 'rgba(54, 162, 235, 1)',
    borderWidth: 1
  }]
};


const avgAgeChartData = {
  labels: (averageAgeData || []).map(item => (item && item._id) || 'Unknown'),
  datasets: [
    {
      label: 'Average Age',
      data: (averageAgeData || []).map(item => {
        const avg = item && item.averageAge;
        return typeof avg === 'number' && !isNaN(avg) ? parseFloat(avg.toFixed(1)) : 0;
      }),
      backgroundColor: 'rgba(255, 159, 64, 0.6)',
      borderColor: 'rgba(255, 159, 64, 1)',
      borderWidth: 1
    }
  ]
};


  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Healthcare Management System</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setActivePage('add')}>Add Patient</button>
        <button onClick={() => setActivePage('view')} style={{ marginLeft: 10 }}>View Patients</button>
      </div>


      {activePage === 'add' && (
        <div>
          <h3>Add New Patient</h3>
          <form onSubmit={handleAddSubmit}>
            <input name="name" placeholder="Name" value={newPatient.name} onChange={handleAddChange} required /><br /><br />
              <input type="date" max="2099-12-31" min="1900-01-01" name="dateOfBirth" value={newPatient.dateOfBirth} onChange={handleAddChange} required /><br /><br />
            <input name="phoneNumber" placeholder="Phone Number" value={newPatient.phoneNumber} onChange={handleAddChange} required /><br /><br />
            <input type="date" max="2099-12-31" min="1900-01-01" name="dateOfAppointment" value={newPatient.dateOfAppointment} onChange={handleAddChange} required /><br /><br />
            <input name="prescribedMedication" placeholder="Prescribed Medication" value={newPatient.prescribedMedication} onChange={handleAddChange} /><br /><br />
            <input name="departmentOfAdmission" placeholder="Department of Admission" value={newPatient.departmentOfAdmission} onChange={handleAddChange} /><br /><br />
            <button type="submit">Submit</button>
          </form>
        </div>
      )}

      {activePage === 'view' && (
        <div>
          <h3>Patient Records</h3>
          <table border="1" cellPadding="8" cellSpacing="0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Phone Number</th>
                <th>Date of Appointment</th>
                <th>Prescribed Medication</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p._id}>
                  {editingId === p._id ? (
                    <>
                      <td><input name="name" value={editValues.name} onChange={handleEditChange} /></td>
                      <td><input type="date" max="2099-12-31" min="1900-01-01" name="dateOfBirth" value={editValues.dateOfBirth} onChange={handleEditChange} /></td>
                      <td><input name="phoneNumber" value={editValues.phoneNumber} onChange={handleEditChange} /></td>
                      <td><input type="date" max="2099-12-31" min="1900-01-01" name="dateOfAppointment" value={editValues.dateOfAppointment} onChange={handleEditChange} /></td>
                      <td><input name="prescribedMedication" value={editValues.prescribedMedication} onChange={handleEditChange} /></td>
                      <td><input name="departmentOfAdmission" value={editValues.departmentOfAdmission} onChange={handleEditChange} /></td>
                      <td>
                        <button onClick={() => handleSave(p._id)}>Save</button>
                        <button onClick={() => setEditingId(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{p.name}</td>
                      <td>{new Date(p.dateOfBirth).toLocaleDateString()}</td>
                      <td>{p.phoneNumber}</td>
                      <td>{new Date(p.dateOfAppointment).toLocaleDateString()}</td>
                      <td>{p.prescribedMedication}</td>
                      <td>{p.departmentOfAdmission}</td>
                      <td>
                        <button onClick={() => startEditing(p)}>Update</button>
                        <button onClick={() => handleDelete(p._id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={{ marginTop: 40 }}>Most Prescribed Medications</h4>
          <div style={{ maxWidth: 600 }}>
            <Bar data={medicationChartData} options={chartOptions} />
          </div>

          <h4 style={{ marginTop: 40 }}>Frequency of Visits Per Month</h4>
          <div style={{ maxWidth: 600 }}>
            <Bar data={visitsChartData} options={chartOptions} />
          </div>
          
                      <h4 style={{ marginTop: 40 }}>Average Age per Department</h4>
<div style={{ maxWidth: 600 }}>
  <Bar data={avgAgeChartData} options={chartOptions} />
</div>



        </div>
      )}
    </div>
  );
} 
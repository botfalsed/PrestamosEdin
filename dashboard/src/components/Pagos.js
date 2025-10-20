import React, { useState, useEffect } from 'react';
   import axios from 'axios';

   const Pagos = () => {
     const [prestamos, setPrestamos] = useState([]);
     const [formData, setFormData] = useState({
       id_prestamo: '',
       monto_pago: '',
     });
     const [message, setMessage] = useState('');

     useEffect(() => {
       // Cargar lista de préstamos activos desde la API
       axios.get('http://localhost:8080/api_postgres.php?action=prestamos')
         .then(response => {
           const prestamosActivos = response.data.filter(p => parseFloat(p.saldo_pendiente) > 0);
           setPrestamos(prestamosActivos);
         })
         .catch(error => console.error('Error fetching prestamos:', error));
     }, []);

     const handleInputChange = (e) => {
       setFormData({ ...formData, [e.target.name]: e.target.value });
     };

     const handleSubmit = (e) => {
       e.preventDefault();
       axios.post('http://localhost:8080/api_postgres.php?action=pago', {
         id_prestamo: parseInt(formData.id_prestamo),
         monto_pago: parseFloat(formData.monto_pago),
       })
         .then(response => {
           const updatedPrestamo = response.data;
           setPrestamos(prestamos.map(p => 
             p.id_prestamo === updatedPrestamo.id_prestamo ? updatedPrestamo : p
           ));
           setMessage('Pago registrado exitosamente');
           setFormData({ id_prestamo: '', monto_pago: '' });
           setTimeout(() => setMessage(''), 3000); // Limpiar mensaje después de 3 segundos
         })
         .catch(error => {
           console.error('Error registrando pago:', error);
           setMessage('Error al registrar el pago');
           setTimeout(() => setMessage(''), 3000);
         });
     };

     return (
       <div className="pagos-container">
         <h2>Registrar Pago</h2>
         {message && <p className={message.includes('exitosamente') ? 'success-message' : 'error-message'}>{message}</p>}
         
         <div className="pagos-form">
           <form onSubmit={handleSubmit}>
             <div className="form-group">
               <label>Préstamo:</label>
               <select
                 name="id_prestamo"
                 value={formData.id_prestamo}
                 onChange={handleInputChange}
                 required
               >
                 <option value="">Selecciona un préstamo</option>
                 {prestamos.map(prestamo => (
                   <option key={prestamo.id_prestamo} value={prestamo.id_prestamo}>
                     {prestamo.nombre} - Saldo: ${parseFloat(prestamo.saldo_pendiente).toFixed(2)}
                   </option>
                 ))}
               </select>
             </div>
             <div className="form-group">
               <label>Monto del Pago:</label>
               <input
                 type="number"
                 name="monto_pago"
                 value={formData.monto_pago}
                 onChange={handleInputChange}
                 step="0.01"
                 min="0"
                 required
               />
             </div>
             <button type="submit">Registrar Pago</button>
           </form>
         </div>

         <div className="pagos-list">
           <h3>Préstamos Activos</h3>
           {prestamos.length > 0 ? (
             <table className="pagos-table">
               <thead>
                 <tr>
                   <th>Prestatario</th>
                   <th>Monto Inicial</th>
                   <th>Saldo Pendiente</th>
                 </tr>
               </thead>
               <tbody>
                 {prestamos.map(prestamo => (
                   <tr key={prestamo.id_prestamo}>
                     <td>{prestamo.nombre}</td>
                     <td>${parseFloat(prestamo.monto_inicial).toFixed(2)}</td>
                     <td>${parseFloat(prestamo.saldo_pendiente).toFixed(2)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           ) : (
             <p>No hay préstamos activos</p>
           )}
         </div>
       </div>
     );
   };

   export default Pagos;

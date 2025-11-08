import React, { useState } from "react";
import "./AddRowAccordion.css";

const AddRowAccordion = ({ open, setOpen, onAddRow }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;
    onAddRow(formData);
    setFormData({ nombre: "", descripcion: "" });
  };

  return (
    <div className="add-row-accordion">
      <div
        className={`accordion-header ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <h3>{open ? "−" : "+"} Nuevo Registro</h3>
      </div>

      <div className={`accordion-content ${open ? "open" : ""}`}>
        <form className="add-row-form" onSubmit={handleSubmit}>
          <div className="form-fields">
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Nombre"
            />
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Descripción"
            />
          </div>
          <div className="form-buttons">
            <button type="submit">Agregar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRowAccordion;

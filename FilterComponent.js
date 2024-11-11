import React, { useState } from 'react';
import { Form, Button, Dropdown } from 'react-bootstrap';
import { FaFilter } from 'react-icons/fa';

function FilterComponent({ columns, onApplyFilters }) {
    const initialFilters = columns.reduce((acc, column) => {
        acc[column.key] = '';
        return acc;
    }, {});

    const [filters, setFilters] = useState(initialFilters);
    const [showFilters, setShowFilters] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onApplyFilters(filters);
        setShowFilters(false); // Close the menu after applying filters
    };

    const handleRemoveFilters = () => {
        setFilters(initialFilters);
        onApplyFilters(initialFilters);
    };

    return (
        <div className="filter-component"> 
            <Dropdown>
                <Dropdown.Toggle variant="light" id="filter-dropdown">
                    <FaFilter /> Filter
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Form onSubmit={handleSubmit} className="p-3">
                        {columns.map((column) => (
                            <Form.Group key={column.key} className="mb-2">
                                <Form.Control
                                    type={column.type || "text"}
                                    name={column.key}
                                    placeholder={column.placeholder}
                                    value={filters[column.key]}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        ))}
                        <Button type="submit" variant="primary">Apply Filters</Button>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            className="mt-2" 
                            onClick={handleRemoveFilters}
                        >
                            Remove Filters
                        </Button>
                    </Form>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}

export default FilterComponent;
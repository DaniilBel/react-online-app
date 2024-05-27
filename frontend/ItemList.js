import React, {useEffect, useState} from 'react';

const ItemList = () => {
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetch('/api/items')
            .then(response => response.json())
            .then(data => setItems(data));
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        const newItem = { name, description };

        fetch('/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newItem)
        })
            .then(response => response.json())
            .then(data => setItems([...items, data]));

        setName('');
        setDescription('');
    };

    return (
        <div>
            <h1>Items</h1>
            <ul>
                {items.map(item => (
                    <li key={item.id}>{item.name}: {item.description}</li>
                ))}
            </ul>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Name"
                    required
                />
                <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description"
                    required
                />
                <button type="submit">Add Item</button>
            </form>
        </div>
    );
};

export default ItemList;

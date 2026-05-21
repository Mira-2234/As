const Pet = require('../models/Pet');
const User = require('../models/User');

// Get all pets with search, filter, sort
exports.getAllPets = async (req, res) => {
  try {
    const { search, species, sort } = req.query;
    let query = {};

    // Search by name using $regex
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by species using $in
    if (species) {
      query.species = { $in: species.split(',') };
    }

    let pets = Pet.find(query);

    // Sorting
    if (sort === 'price-asc') {
      pets = pets.sort({ adoptionFee: 1 });
    } else if (sort === 'price-desc') {
      pets = pets.sort({ adoptionFee: -1 });
    } else if (sort === 'newest') {
      pets = pets.sort({ createdAt: -1 });
    }

    const results = await pets;
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get pets', error: error.message });
  }
};

// Get pet by ID
exports.getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get pet', error: error.message });
  }
};

// Add pet (only logged in users)
exports.addPet = async (req, res) => {
  try {
    const { name, species, breed, age, gender, imageURL, healthStatus, vaccinationStatus, location, adoptionFee, description } = req.body;

    const pet = new Pet({
      name,
      species,
      breed,
      age,
      gender,
      imageURL,
      healthStatus,
      vaccinationStatus,
      location,
      adoptionFee,
      description,
      owner: req.user.userId,
      ownerEmail: req.user.email
    });

    await pet.save();
    res.status(201).json({ message: 'Pet added successfully', pet });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add pet', error: error.message });
  }
};

// Update pet
exports.updatePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Only owner can update
    if (pet.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this pet' });
    }

    const updatedPet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Pet updated successfully', pet: updatedPet });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update pet', error: error.message });
  }
};

// Delete pet
exports.deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Only owner can delete
    if (pet.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this pet' });
    }

    await Pet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete pet', error: error.message });
  }
};

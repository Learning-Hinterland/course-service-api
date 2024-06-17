const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(
    {
        log: ['query'],
    }
);

async function createMaterial(req, res, next) {
    try {
        const { name, description, course_id } = req.body;

        // Check if the material is already created
        const materialExists = await prisma.courseMaterial.findFirst({
            where: {
                name: name
            }
        });
        if (materialExists) {
            return res.status(400).json({
                status: false,
                message: 'Material already exists',
                error: null,
                data: null
            });
        }

        let material = await prisma.courseMaterial.create({
            data: {
                name,
                description,
                course_id: Number(course_id)
            }
        });

        res.status(201).json({
            status: true,
            message: 'Material created successfully',
            error: null,
            data: material
        });
    } catch (error) {
        next(error);
    }
}

// endpoint get all materials
async function getMaterials(req, res, next) {
    try {
        const materials = await prisma.courseMaterial.findMany({
            include: {
                lecturer: true
            }
        });

        res.status(200).json({
            status: true,
            message: 'Materials retrieved successfully',
            error: null,
            data: materials
        });
    } catch (error) {
        next(error);
    }
}

// endpoint get material by id
async function getMaterialById(req, res, next) {
    try {
        const { id } = req.params;
        const material = await prisma.courseMaterial.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!material) {
            return res.status(404).json({
                status: false,
                message: 'Material not found',
                error: null,
                data: null
            });
        }

        res.status(200).json({
            status: true,
            message: 'Material retrieved successfully',
            error: null,
            data: material
        });
    } catch (error) {
        next(error);
    }
}

// endpoint update material by id
async function updateMaterial(req, res, next) {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        let material = await prisma.courseMaterial.update({
            where: {
                id: Number(id)
            },
            data: {
                name,
                description
            }
        });

        res.status(200).json({
            status: true,
            message: 'Material updated successfully',
            error: null,
            data: material
        });
    } catch (error) {
        next(error);
    }
}

// endpoint delete material by id
async function deleteMaterial(req, res, next) {
    try {
        const { id } = req.params;
        await prisma.courseMaterial.delete({
            where: {
                id: Number(id)
            }
        });

        res.status(200).json({
            status: true,
            message: 'Material deleted successfully',
            error: null,
            data: null
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { createMaterial, getMaterials, getMaterialById, updateMaterial, deleteMaterial };
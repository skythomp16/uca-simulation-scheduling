<script setup>
import {ref} from 'vue';

const inputFilePath = ref('');
const outputFilePath = ref('');
let studentSchedules = [];

async function readInput() {
    await chooseDirectory(true);

    try {
        const response = await electronAPI.readExcelFiles(inputFilePath.value);
        if (!response.success) {
            console.error("Error while reading files:", response.message);
            alert("An error occurred while reading the files. Please try again.");
            return;
        }
        studentSchedules = response.data;
    } catch (error) {
        console.error("Error while reading files:", error);
        alert("An error occurred while reading the files. Please try again.");
    }
}

async function outputFile() {
    if (outputFilePath.value === '') {
        return;
    }

    const HEADER_ROW = [
        {
            value: 'Name',
            fontWeight: 'bold'
        },
        {
            value: 'Date of Birth',
            fontWeight: 'bold'
        },
        {
            value: 'Cost',
            fontWeight: 'bold'
        },
        {
            value: 'Paid',
            fontWeight: 'bold'
        }
    ]

    const DATA_ROW_1 = [
        {
            value: 'John Smith'
        },
        {
            value: 'Textract'
        },
        {
            value: 1800
        },
        {
            value: true
        }
    ]

    // Generate data



    let data = [
        // Monday
        [
            HEADER_ROW,
            DATA_ROW_1
        ],
        // Tuesday
        [
            HEADER_ROW,
            DATA_ROW_1
        ],
        // Wednesday
        [
            HEADER_ROW,
            DATA_ROW_1
        ],
        // Thursday
        [
            HEADER_ROW,
            DATA_ROW_1
        ],
        // Friday
        [
            HEADER_ROW,
            DATA_ROW_1
        ]
    ];

    const output = processStudentAvailability(studentSchedules);

    console.log(output);

    try {
        const outputPath = String(outputFilePath.value);
        const serializedData = JSON.stringify(output);
        const response = await electronAPI.writeExcelFile(outputPath, serializedData);

        if (response.success) {
            alert("Output file saved successfully.");
        } else {
            console.error("Error while saving file:", response.message);
            alert("An error occurred while saving the output file. Please try again.");
        }
    } catch (error) {
        console.error("Error while writing file:", error);
        alert("An error occurred while writing the file. Please try again.");
    }
}

async function chooseDirectory(input) {
    // Allow user to choose a directory
    let location = null;
    try {
        location = await electronAPI.openFileChooser(true);
    } catch (error) {
        console.error("Error while opening the file chooser:", error);
        alert("An error occurred while choosing a file. Please try again.");
        return;
    }
    if (location !== null) {
        if (input) {
            inputFilePath.value = location;
        } else {
            outputFilePath.value = location;
        }
    }
}

function processStudentAvailability(data) {
    const MWF_SLOTS = [
        "08:00-08:50", "09:00-09:50", "10:00-10:50", "11:00-11:50", "12:00-12:50",
        "01:00-01:50", "02:00-02:50", "03:00-03:50", "04:00-04:50"
    ];
    const TR_SLOTS = [
        "08:00-09:15", "09:25-10:40", "10:50-12:05", "12:15-01:30", "01:40-02:30",
        "02:40-03:55", "04:05-05:20"
    ];
    const DAYS = ["M", "T", "W", "R", "F"];
    const TIME_SLOTS = { M: MWF_SLOTS, W: MWF_SLOTS, F: MWF_SLOTS, T: TR_SLOTS, R: TR_SLOTS };

    let studentCounter = 1; // Counter for assigning student names
    let studentAvailability = []; // Array to track student availabilities

    // Process each file
    data.forEach((fileData) => {
        if (fileData.rows && Array.isArray(fileData.rows)) {
            const [headerRow, ...dataRows] = fileData.rows;

            // Initialize this student's availability
            const studentName = `Student ${studentCounter++}`;

            // Default availability for all time slots (every day)
            let student = {
                name: studentName,
                availability: {
                    M: Array(MWF_SLOTS.length).fill("Available"),
                    W: Array(MWF_SLOTS.length).fill("Available"),
                    F: Array(MWF_SLOTS.length).fill("Available"),
                    T: Array(TR_SLOTS.length).fill("Available"),
                    R: Array(TR_SLOTS.length).fill("Available"),
                },
            };

            // Process each class for this student
            dataRows.forEach((row) => {
                const days = row[12]; // e.g., "MWF" or "TR"
                const time = row[13]; // e.g., "12:00 pm-12:50 pm"

                if (!days || !time || time === "TBA") return; // Skip invalid or "TBA" rows

                // Normalize and identify time slots
                const startTime = normalizeStartTime(time); // Extract normalized start time, e.g., "12:00-12:50"
                let matchedSlotIndices = {};

                days.split("").forEach((day) => {
                    const timeSlots = TIME_SLOTS[day];

                    // Make sure this is a valid day with predefined time slots
                    if (!timeSlots) return;

                    const cleanedStartTime = startTime.replace(/\s?(am|pm)/i, ""); // Strip am/pm

                    // Find the index of the time slot that includes the cleaned startTime
                    const index = timeSlots.findIndex((slot) => slot.includes(cleanedStartTime));

                    if (index !== -1) {
                        matchedSlotIndices[day] = index;
                    }
                });
                // Mark matched slots as "Not Available"
                for (const day in matchedSlotIndices) {
                    const index = matchedSlotIndices[day];
                    if (index !== undefined) {
                        student.availability[day][index] = "Not Available";
                    }
                }
            });

            // Add the processed student to the list
            studentAvailability.push(student);
        }
    });

    // Format the output data to match the requested structure
    const output = DAYS.map((day) => {
        const timeSlots = TIME_SLOTS[day];

        // Header row for each day
        const HEADER_ROW = [
            { value: "Name", fontWeight: "bold" },
            ...timeSlots.map((slot) => ({ value: slot, fontWeight: "bold" })),
        ];

        // Data rows for each student
        const DATA_ROWS = studentAvailability.map((student) => [
            { value: student.name },
            ...student.availability[day].map((status) => ({ value: status })),
        ]);

        return [HEADER_ROW, ...DATA_ROWS];
    });

    return output;
}

// Helper function to normalize start time in slots
function normalizeStartTime(time) {
    try {
        // Extract the first portion of the time (start time), e.g. "12:00 pm" from "12:00 pm-12:50 pm"
        const [startTime] = time.split("-");

        // Normalize to a format directly comparable with MWF_SLOTS/TR_SLOTS
        return startTime.trim().toLowerCase().replace(/\s+/g, "");
    } catch (error) {
        console.error("Error normalizing time: ", time, error);
        return null;
    }
}
</script>

<template>
    <div class="container-fluid">
        <form class="mb-3 mt-2">
            <!-- Input Location -->
            <div class="mb-3">
                <div class="d-flex">
                    <input type="text" class="form-control me-2" :value="inputFilePath" readonly placeholder="Choose the input excel directory..." />
                    <button type="button" class="btn btn-primary" @click="readInput">
                        Browse
                    </button>
                </div>
            </div>

            <!-- Output Location -->
            <div class="mb-3">
                <div class="d-flex">
                    <input type="text" class="form-control me-2" :value="outputFilePath" readonly placeholder="Choose the directory to save the output..." />
                    <button type="button" class="btn btn-primary" @click="chooseDirectory(false)">
                        Browse
                    </button>
                </div>
            </div>
        </form>

        <!-- Preview Pane -->
        <div class="mb-3">

        </div>

        <!-- Submit Button -->
        <div class="mb-3">
            <button type="button" class="btn btn-primary" @click="outputFile">Process</button>
        </div>
    </div>
</template>

<style scoped>

</style>
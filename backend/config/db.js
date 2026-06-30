const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Programmatically check and create Atlas Vector Search Index on chunks collection
    try {
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      const chunksColExists = collections.some(
        (col) => col.name === "chunks"
      );

      if (chunksColExists) {
        const db = mongoose.connection.db;
        
        // listSearchIndexes is supported in newer MongoDB driver versions on Atlas
        let indexExists = false;
        try {
          const indexes = await db
            .collection("chunks")
            .listSearchIndexes()
            .toArray();
          indexExists = indexes.some(
            (idx) => idx.name === "vector_index"
          );
        } catch (e) {
          // Fallback if listSearchIndexes fails
          indexExists = false;
        }

        if (!indexExists) {
          console.log(
            "Creating Atlas Vector Search index 'vector_index'..."
          );
          await db.collection("chunks").createSearchIndex({
            name: "vector_index",
            definition: {
              mappings: {
                dynamic: true,
                fields: {
                  embedding: {
                    dimensions: 768,
                    similarity: "cosine",
                    type: "knnVector",
                  },
                  pdfId: {
                    type: "token",
                  },
                },
              },
            },
          });
          console.log("Atlas Vector Search index creation initiated.");
        }
      }
    } catch (indexErr) {
      console.log(
        "Note: Atlas Vector Search index automatic check/creation skipped or not supported on this cluster:",
        indexErr.message
      );
    }
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
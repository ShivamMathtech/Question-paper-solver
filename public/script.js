document
  .getElementById("upload-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("questionFile");
    const formData = new FormData();
    formData.append("questionFile", fileInput.files[0]);

    // Send file to the backend
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const downloadLink = document.getElementById("downloadLink");
      downloadLink.href = `/download/${data.filename}`;
      document.getElementById("download-container").style.display = "block";
    } else {
      alert("Error solving questions!");
    }
  });

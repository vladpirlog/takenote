const imagePreview = document.getElementById('image_preview');
const select_file = document.getElementById('select_file');

select_file.onchange = function (ev) {
    const photo = ev.target.files[0];
    const formData = new FormData();
    formData.append('photo', photo);

    axios.post('/api/note/attachment/add', formData)
        .then(function (response) {
            imagePreview.src = response.data.secure_url;
        }).catch(function (err) {
        console.log(err.response || 'There was a problem.');
        alert('Could not upload file.');
    });
};
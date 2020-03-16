const sidebar = document.getElementsByClassName('sidebar')[0];
const dashbordContent = document.getElementsByClassName('dashboard-workspace')[0];

function displayContent(ev) {
    const noteTitle = ev.target.textContent;
    const collectionTitle = ev.target.parentElement.querySelector('.sidebar-container-heading').textContent;
    axios.get(`/api/note/${collectionTitle}/${noteTitle}`)
        .then(function (response) {
            if (response.status < 300) {
                dashbordContent.textContent = response.data[0].note.content;
            } else console.log(response.status, response.responseText);
        }).catch(function (err) {
        console.log(err);
    });
}

axios.get('/api/user/collections?includeCollaborations=true')
    .then(function (response) {
        const data = response.data;
        for (let col of data[0].collections) {
            let container = document.createElement('div');
            container.classList.add('sidebar-container');
            container.classList.add('animate');
            let containerHeading = document.createElement('div');
            containerHeading.classList.add('sidebar-container-heading');
            containerHeading.textContent = col.title;
            container.appendChild(containerHeading);
            for (let note of col.notes) {
                let containerElement = document.createElement('div');
                containerElement.classList.add('sidebar-container-element');
                containerElement.textContent = note.title;
                containerElement.onclick = displayContent;
                container.appendChild(containerElement);
            }
            sidebar.appendChild(container);
        }
    }).catch(function (err) {
    console.log(err);
});
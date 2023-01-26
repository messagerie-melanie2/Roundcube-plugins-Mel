$(document).ready(() => {
    if (rcmail.env.task === 'rotomecatest') {


        const from = 0;
        const to = 100;

        for (let index = from; index <= to; index += 2) {   
            $('#layout-content').append(`
            ${index}% { 
                .mask-conic-gradiant(${Math.round(-index * 3.6)}deg);
             }
             <br/>
            `);
        }
    }
});
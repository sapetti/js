
//----------------------------------------------------------------->>> common
var socket = io.connect(getUrl());

//----------------------------------------------------------------->>> view_quiz

socket.on('showQuestionToAdmin', function (data) {
    $('#quiz_question').html('Pregunta '+(data.number+1)+' - '+data.q);
    socket.emit('updateResults');
});

socket.on('showResults', function (data) {
    $('#quiz_question').html('');

    var str = '<table class="table table-striped">';
    str+='<thead><tr><th>User</th>';
    for(var i=0;i<data.max;i++) {
        str+='<th>Q'+(i+1)+'</th>';
    }
    str+='<tbody>';

    var winners = [];
    for(var key in data.results) {
        var total = 0;
        var winnerClass = data.results[key].isWinner ? 'class="winner"' : '';
        str+='<tr class="participant">';
        str+='<td '+winnerClass+'>'+key+'</td>';
        for(var i=0;i<data.max;i++) {
            if(i<data.results[key].q.length && data.results[key].q[i]!= null && data.results[key].q[i] == true) {
                str+='<td '+winnerClass+'><span class="glyphicon glyphicon-ok greenIcon"></span></td>';
                total++;
            } else {
                str+='<td '+winnerClass+'><span class="glyphicon glyphicon-remove redIcon"></span></td>';
            }
        }
        str+='</tr>';
    }
    str+='</tbody></table>';
    $('#summaryQuiz').html(str);
});

socket.on('updateResultsTable', function (data) {
    var str = '<table class="table table-striped table-condensed">';
    str+='<thead><tr><th>User</th>';
    for(var i=0;i<data.max;i++) {
        str+='<th>Q'+(i+1)+'</th>';
    }
    str+='<tbody>';
    for(var key in data.data) {
        str+='<tr>';
        str+='<td>'+key+'</td>';
        for(var i=0;i<data.max;i++) {
            if(i<data.data[key].length && data.data[key][i] > -1) {
                str+='<td><span class="glyphicon glyphicon-pencil"></span></td>';
            } else {
                str+='<td></td>';
            }
        }
        str+='</tr>';
    }
    str+='</tbody></table>';
    $('#summaryQuiz').html(str);
});



//----------------------------------------------------------------->>> view_raffle

socket.on('showRaffle', function (data) {
  console.log('showRaffle');
  //loadRaffleWinners(data);
  $('#summary').html('');
});

function loadRaffleWinners(data) {
    var str = '<table class="table table-striped">';
    str+='<tbody>';
    for(var i=0;i<data.n.length;i++) {
        str+='<tr><td>'+data.n[i]+'</td></tr>';
    }
    str+='</tbody></table>';
    $('#summary').html(str);
}

socket.on('newWinner', function (data) {
    console.log('newWinner');
    //socket.emit('displayRaffle');
    if(data.w) {
        showWinner(data.w);
    } else {
        showWinner('Error');
    }
});

socket.on('newWinnerTable', function (data) {
    console.log('newWinnerTable');
    if(data.n) {
        loadRaffleWinners(data);
    } else {
        console.log('newWinnerTable error!! empty data');
    }
});

//----------------------------------------------------------------->>> admin_quiz

function cancelSubmit(e) {
    e.preventDefault();
    $('q').val('');
    $('a1').val('');
    $('a2').val('');
    $('a3').val('');
    $('a4').val('');
    $('#action-1').click();
}

$(function() {

/////////////从服务器读取数据或者从本地取数据
    var localdata = localStorage.todos;
    var todos = localdata ?  $.parseJSON(localdata) : $.get({
        url:'php/selectTodo.php',
        dataType:'json'
    }).done(function(data){
        todos = data;
        saveData()
        render()
        piliang()
    }),
    state = localStorage.data || 'all',
    main = $('#main'),
    footer = $('#footer');
    
    main.hide();
    footer.hide();

/////////////存储数据
    function saveData(){
        localStorage.todos = JSON.stringify(todos);
    }

/////////////渲染数据
    function render(){
        if (todos.length > 0) {
            main.show();
            footer.show();
        };
        if (todos.length === 0) {
            main.hide();
            footer.hide();
        };
    	var ftodos = $.grep(todos,function(v){                         //过滤数组中符合条件的
			if( state === 'all' ){
				return v
			}else if( state === 'active'){
				return v.isDone === '0'
			}else if( state === 'completed'){
				return v.isDone === '1'
			}
		})
    	$('#todo-list').empty().append( function(){                    //先清空页面数据，追加新数据
    		return $.map(ftodos,function(v){                           //追加的内容为：过滤上面的数据，生成新数组
                var tmp = v.isDone==='1' ? 'checked' : ''              //判断isDown的状态 决定是否被选中
                return '<li class="'+(v.isDone==='1' ? 'completed' : '')+'" data-id="'+v.id+'"><div class="view"><input class="toggle" type="checkbox" '+tmp+'><label for="">'+v.content+'</label><button class="destroy"></button></div><input type="text" class="edit" value="'+v.content+'"></li>'
    		})
    	})
        $('#filters .selected').removeClass('selected')               //根据状态添加边框类
        $('footer a[data-role='+state+']').addClass('selected')
		$('#todo-count strong').text(ftodos.length)                   //条数
        toggleAll()
    }

    var piliang = function(){                                         //批量删除按钮的出现
        if( $('.completed').length === 0){
            $('#clear-completed').css('opacity',0);
        }else{
            $('#clear-completed').css('opacity',1);
        }
    }
    render()
    piliang()

/////////////增
    var addTodo = function(e){                                        
        var zhi = $.trim( $(this).val() )                                             //排除空数据
        if( e.keyCode === 13 && zhi !== ''){                                          //回车添加且不空
        	var todo ={                                                               //添加的数据 id content isDown
        		id: todos.length ? (Math.max.apply(null,$.map(todos,function(v){
                    return v.id
        		})) + 1 + '') : '1001',
        		content:zhi,
        		isDone:'0'
        	}
        	todos.push(todo);                                                        //追加
        	saveData();                                                              //保存
        	render();                                                                //渲染
            $.get({                                                                  //数据库增加
                url:'php/addTodo.php',
                data:todo,
            }).done(function(){

            }).fail(function(){

            })
            $(this).val('');                                                         //输入框在写完内容后立即清空
        }
    }
    $('#new-todo').on('keyup',addTodo)                                               //回调函数

/////////////删
    var deleteDoto = function(){
        $(this).closest('li').remove();                                  //页面删除
        var id = $(this).closest('li').attr('data-id');
        todos = $.grep(todos,function(v){                                //本地删除 留下与要删除的id不同的值
            return id !== v.id
        })
        saveData();                                                      //存储
        render();                                                        //渲染
        $.get({                                                          //数据库删除
                url:'php/deleteTodo.php',
                data:{id:id},
            }).done(function(){

            }).fail(function(){

            })
    }
    $('#todo-list').on('click','.destroy',deleteDoto)                    //委托回调

/////////////改
    var changeinput = function(e){                                       //文本框的修改
        $(this).addClass('editing');
        var input = $(this).find('.edit');
        input.val( input.val() ).focus();                                //把input原来的值拿出来再次赋值进去，之后调用focus()
    }
    $('#todo-list').on('dblclick','li',changeinput)                      //双击编辑文本框

    $('#todo-list').on('focusout','.edit',function(){                    //失去焦点去掉文本框样式
    	$(this).closest('li').removeClass('editing');
    })

    var updateinput = function(e){                                       //修改的函数
        var id = $(this).closest('li').attr('data-id');                 //当前数据的id      
        var value = $(this).val();                                      //当前修改的值
        $.each(todos,function(i,v){                                     //遍历数据，
           if( v.id === id ){                                           //如果当前的id相等，新的内容给了旧数据
                v.content = value;
           }
        })
        saveData();                                                    //存
        render();                                                      //染
        $.get({
                url:'php/updateTodo.php',
                data:{id:id,content:value},
            }).done(function(){

            }).fail(function(){

            })
    }
    $('#todo-list').on('change','.edit',updateinput)


    var changechecked = function(e){                                     //圆圈，即选中的标识的修改
        var state = $(this).prop('checked');                             //通过给input添加设置新的属性，来判断是否选中
        if( state === true){
            state = '1'
        }else if( state === false ){
            state = '0'
        }
        var value = $(this).closest('li').find('.edit').val();           
        var id = $(this).closest('li').attr('data-id')
        $.each(todos,function(i,v){ 
            if( v.id === id ){                                           //通过相同的id给状态
                v.isDone = state;
            }
        })
        saveData()
        render()
        piliang()
        toggleAll()
        $.get({
            url:'php/updateTodo.php',
            data:{id:id,content:value,isDone:state},
        }).done(function(){

        }).fail(function(){

        })
    }

    $('#todo-list').on('click','.toggle',changechecked)

/////////////UI细节处理
    $('#filters a').on('click',function(){
        $('#filters .selected').removeClass('selected')
        $(this).addClass('selected');
        state = localStorage.state = $(this).attr('data-role');
        render()
    })

/////////////批量删除
    var deleteAll = function(e){
         $('#clear-completed').on('click',function(){
            todosId = $.grep(todos,function(v){                         //过滤数据，对于状态是1的即被选中的，返回数据
                if( v.isDone === '1' ){
                    return v;
                }
        })
        $.each(todosId,function(i,v){                              //对上面过滤掉的内容进行遍历后数据库删除
            $.get({
                url:'php/deleteTodo.php',
                data:{id:v.id},
            }).done(function(){
            }).fail(function(){
            })
        })
        todos = $.grep(todos,function(v){                        // 过滤掉1 留下没有被选中的
            if( v.isDone === '0' ){
                return v
            }
        })
        saveData()
        render()       
     })
    }
    deleteAll()

/////////////批量选中
    function toggleAll(){
        var newTodos = $.grep(todos,function(v){
            return v.isDone === '1'
        })
        if(newTodos.length === todos.length){
            $('#toggle-all').attr('checked',true)
        }
    }
    
    $('#toggle-all').on('click',function(){
        var state = $(this).prop('checked')
        if ($(this).prop('checked')) {
            state = '1';
            $('#clear-completed').css('opacity',1)
        } else {
            state = '0';
            $('#clear-completed').css('opacity',1)
        }
        todos = $.grep(todos, function(v) {
            return v.isDone = state;
        })
        saveData();
        render();
        $.each(todos, function(i, v) {
            $.get({
                url: 'php/updateTodo.php',
                data: {
                    id: v.id,
                    content: v.content,
                    isDone: state
                },
            }).done(function() {

            }).fail(function() {

            })
        })
    })

//////////////进度条
    var one = $('.one');
    $(document).ajaxStart(function(){
        one.stop(true,true).css({
            width:50,
            opacity:0,
            background:'#66cd00'
        })
        one
        .animate({opacity:1},40)
    })
    $(document).ajaxSend(function(){
        one
        .animate({width:$(window).outerWidth(true)*0.8},500)
    })
    $(document).ajaxSuccess(function(){
        one.delay(30)
        .queue(function(){$(this).css('background','#7fff00').dequeue()})
        .animate({width:$(window).outerWidth(true)},300)
    })
    $(document).ajaxError(function(){
        one
        .finish() 
        .css('background','red')
        .animate({left:0,top:0,opacity:0},200)
    })
    $(document).ajaxComplete(function(){
        one.animate({opacity:0},200)
    })


})
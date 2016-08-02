// https://gist.github.com/fearphage/4341799

import $ from 'jquery';

let slice = [].slice;

$.whenAll = function(array) {
  var
    resolveValues = arguments.length == 1 && $.isArray(array)
      ? array
      : slice.call(arguments)
    ,length = resolveValues.length
    ,remaining = length
    ,deferred = $.Deferred()
    ,i = 0
    ,failed = 0
    ,rejectContexts = Array(length)
    ,rejectValues = Array(length)
    ,resolveContexts = Array(length)
    ,value
  ;

  function updateFunc (index, contexts, values) {
    return function() {
      !(values === resolveValues) && failed++;
      deferred.notifyWith(
       contexts[index] = this
       ,values[index] = slice.call(arguments)
      );
      if (!(--remaining)) {
        deferred[(!failed ? 'resolve' : 'reject') + 'With'](contexts, values);
      }
    };
  }
  
  for (; i < length; i++) {
    if ((value = resolveValues[i]) && $.isFunction(value.promise)) {
      value.promise()
        .done(updateFunc(i, resolveContexts, resolveValues))
        .fail(updateFunc(i, rejectContexts, rejectValues))
      ;
    }
    else {
      deferred.notifyWith(this, value);
      --remaining;
    }
  }

  if (!remaining) {
    deferred.resolveWith(resolveContexts, resolveValues);
  }

  return deferred.promise();
};

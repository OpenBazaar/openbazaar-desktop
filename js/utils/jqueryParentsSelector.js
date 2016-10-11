import $ from 'jquery';

// implements a :parents pseudo selector in jQuery
// http://stackoverflow.com/a/965962/632806
$.expr[':'].parents = (a, i, m) => $(a).parents(m[3]).length < 1;

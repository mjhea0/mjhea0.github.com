function generateTOC(insertBefore, heading) {
  var container = $("<div id='tocBlock'></div>");
  var div = $("<ol id='toc'></ol>");
  var content = $(insertBefore).first();

  if (heading !== undefined && heading !== null) {
    container.append('<h2 class="tocHeading">' + heading + '</h2>');
  }

  div.tableOfContents("#content",{startLevel: 2, depth: 1});
  container.append(div);
  container.insertBefore(insertBefore);
}

function generateTOC(insertBefore, heading) {
  var container = $("<div id='tocBlock' class='hidden-xs hidden-sm'></div>");
  var div = $("<ul id='toc'></ul>");
  var content = $(insertBefore).first();

  if (heading !== undefined && heading !== null) {
    container.append('<h4 class="tocHeading">' + heading + '</h4>');
  }

  div.tableOfContents("#content",{startLevel: 2, depth: 1});
  container.append(div);
  container.insertBefore(insertBefore);
}

/**
 * Created by Nathan on 12/11/2016.
 */

// cs is the new namespace of my capstone project.
var cs = cs || {};


/* ---------- Rect ---------- */

/**
 * Rectangle represented with left, right, bottom, and top edge positions.
 *
 * This uses cartesian coordinates, so:
 *   top > bottom
 *   right > left
 *
 * @param top Top of rectangle.
 * @param left Left of rectangle.
 * @param bottom Bottom of rectangle.
 * @param right Right of rectangle.
 * @constructor
 */

cs.Rect = function(left, right, bottom, top) {
    this.left = left;
    this.right = right;
    this.bottom = bottom;
    this.top = top;
};


/**
 * Copies a rectangle.
 *
 * @returns {cs.Rect}
 */
cs.Rect.prototype.copy = function() {
    return new cs.Rect(this.left, this.right, this.bottom, this.top);
};


/**
 * Checks if this rectangle is overlapping a given rectangle.
 *
 * @param rect Rect to check if overlapping with.
 * @returns {boolean} True if overlapping, else false.
 */
cs.Rect.prototype.overlapping = function(rect) {
    if (this.right <= rect.left || rect.right <= this.left)
        return false;

    if (this.top <= rect.bottom || rect.top <= this.bottom)
        return false;

    return true;
};


/**
 * Checks if this rectangle contains a given rectangle.
 *
 * @param rect Rectangle to check is contained.
 * @returns {boolean} True if rectangle is contained, else false.
 */
cs.Rect.prototype.contains = function(rect) {
    return (this.left <= rect.left
         && this.right >= rect.right
         && this.bottom <= rect.bottom
         && this.top >= rect.top);
};


/**
 * Draws rectangle to a 2D context.
 *
 * @param ctx context to draw to.
 */
cs.Rect.prototype.draw2d = function(ctx) {
    ctx.strokeRect(this.left, ctx.canvas.height - this.top, this.right - this.left, this.top - this.bottom);
};




/* ---------- BinSpaceNode ---------- */

/**
 * Node in a BinSpaceTree.
 *
 * @param rect
 * @param remaining_depth
 * @constructor
 */
cs.BinSpaceNode = function(parent, rect, remaining_depth) {
    this.parent = parent;
    this.rect = rect;
    this.remaining_depth = remaining_depth;

    this.child_a = undefined;
    this.child_b = undefined;

    this.collection = [];
};


/**
 * Splits the node vertically to have two nodes side by side.
 */
cs.BinSpaceNode.prototype.splitVertical = function() {
    var r = this.rect;
    var mid = (r.left + r.right) / 2;
    var left = new cs.Rect(r.left, mid, r.bottom, r.top);
    var right = new cs.Rect(mid, r.right, r.bottom, r.top);

    this.child_a = new cs.BinSpaceNode(this, left, this.remaining_depth-1);
    this.child_b = new cs.BinSpaceNode(this, right, this.remaining_depth-1);
};


/**
 * Splits the node horizontally to have two on top of each other.
 */
cs.BinSpaceNode.prototype.splitHorizontal = function() {
    var r = this.rect;
    var mid = (r.bottom + r.top) / 2;
    var bottom = new cs.Rect(r.left, r.right, r.bottom, mid);
    var top = new cs.Rect(r.left, r.right, mid, r.top);

    this.child_a = new cs.BinSpaceNode(this, bottom, this.remaining_depth-1);
    this.child_b = new cs.BinSpaceNode(this, top, this.remaining_depth-1);
};


/**
 * Finds the node that fully contains a rectangle.
 *
 * @param rect
 * @param isVertical
 * @param depth_left
 * @returns {cs.BinSpaceNode}
 * @private
 */
cs.BinSpaceNode.prototype.findNode = function(rect, isVertical) {
    if (this.remaining_depth === 0)
        return this;

    if (this.child_a === undefined) {
        if (isVertical)
            this.splitVertical();
        else
            this.splitHorizontal();
    }

    if (this.child_a.rect.contains(rect))
    //if (this.child_a.rect.overlapping(rect))
        return this.child_a.findNode(rect, !isVertical);

    else if (this.child_b.rect.contains(rect))
    //else if (this.child_b.rect.overlapping(rect))
        return this.child_b.findNode(rect, !isVertical);

    return this;
};


/**
 * Count the number of rectangles in the subtree.
 *
 * @returns {Number}
 */
cs.BinSpaceNode.prototype.count = function() {
    var count = this.collection.length;
    if (this.child_a !== undefined)
        count += this.child_a.count();
    if (this.child_b !== undefined)
        count += this.child_b.count();
    return count;
};


/**
 * Insert a rectangle and associated object into subtree.
 *
 * @param rect
 * @param obj
 */
cs.BinSpaceNode.prototype.insert = function(rect, obj) {
    var node = this.findNode(rect, true);
    node.collection.push([rect, obj]);
};


/**
 * Removes a specific rectangle (must be exact object)
 *
 * @param rect
 */
cs.BinSpaceNode.prototype.remove = function(rect) {
    var node = this.findNode(rect, true);

    var index = node.collection.findIndex(function(elem) {
        return elem[0] === rect;
    });
    if (index > -1)
        node.collection.splice(index, 1);

    if (node.collection.length === 0 && node.parent !== undefined)
        node.parent.checkDelete();
};


/**
 * Checks if child nodes should be deleted and, if so, deletes them.
 */
cs.BinSpaceNode.prototype.checkDelete = function() {
    if (this.child_a.count() === 0 && this.child_b.count() === 0) {
        this.child_a = undefined;
        this.child_b = undefined;
        if (this.parent !== undefined)
            this.parent.checkDelete();
    };
};


/**
 * Recursively finds rectangles that overlap a test rectangle and adds them to a collection.
 *
 * @param rect
 * @param collection
 * @returns {Array}
 * @private
 */
cs.BinSpaceNode.prototype._findOverlapping = function(rect, collection) {
    var item;
    for (var i=0; i<this.collection.length; i++) {
        item = this.collection[i];

        if (rect.overlapping(item[0])) {
            collection.push(item);
        }
    }

    if (this.child_a !== undefined && this.child_a.rect.overlapping(rect))
        this.child_a._findOverlapping(rect, collection);

    if (this.child_b !== undefined && this.child_b.rect.overlapping(rect))
        this.child_b._findOverlapping(rect, collection);

    return collection;
};


/**
 * Starts finding rectangles overlapping a test rectangle.
 *
 * @param rect
 * @returns {Array}
 */
cs.BinSpaceNode.prototype.findOverlapping = function(rect) {
    return this._findOverlapping(rect, []);
};


/**
 * Recursively finds potentially overlapping rectangles (rectangles that will be checked).
 *
 * @param rect
 * @param collection
 * @returns {Array}
 * @private
 */
cs.BinSpaceNode.prototype._findPotentialOverlapping = function(rect, collection) {
    var item;
    for (var i=0; i<this.collection.length; i++) {
        item = this.collection[i];

        collection.push(item);
    }

    if (this.child_a !== undefined && this.child_a.rect.overlapping(rect))
        this.child_a._findPotentialOverlapping(rect, collection);

    if (this.child_b !== undefined && this.child_b.rect.overlapping(rect))
        this.child_b._findPotentialOverlapping(rect, collection);

    return collection;
};


/**
 * Starts finding rectangles that potentially overlap a test rectangle.
 *
 * @param rect
 * @returns {Array}
 */
cs.BinSpaceNode.prototype.findPotentialOverlapping = function(rect) {
    return this._findPotentialOverlapping(rect, []);
};


/**
 * Draws all nodes and rectangles onto an HTML canvas' 2D context.
 *
 * @param ctx
 */
cs.BinSpaceNode.prototype.debugDraw = function(ctx) {
    ctx.strokeStyle = "#dddddd";
    this.rect.draw2d(ctx);
    ctx.stroke();

    if (this.child_a !== undefined)
        this.child_a.debugDraw(ctx);

    if (this.child_b !== undefined)
        this.child_b.debugDraw(ctx);

    ctx.strokeStyle = "#888888";
    for (var i=0; i<this.collection.length; i++) {
        this.collection[i][0].draw2d(ctx);
    }
    ctx.stroke();
};




/* ---------- BinSpaceTree ---------- */

/**
 * Creates a BinSpaceTree of a specified rect size with a maximum tree depth.
 *
 * @param rect
 * @param max_depth
 * @constructor
 */
cs.BinSpaceTree = function(rect, max_depth) {
    this.rect = rect;
    this.max_depth = max_depth;
    this.root_node = new cs.BinSpaceNode(undefined, rect, max_depth);
};


/**
 * Counts the number of rectangles in the tree.
 *
 * @returns {Number}
 */
cs.BinSpaceTree.prototype.count = function() {
    return this.root_node.count();
};


/**
 * Inserts a rectangle and associated object into the tree.
 *
 * @param rect
 * @param obj
 */
cs.BinSpaceTree.prototype.insert = function(rect, obj) {
    this.root_node.insert(rect, obj);
};


/**
 * Removes a specific rect from the tree (must be exact object).
 *
 * @param rect
 */
cs.BinSpaceTree.prototype.remove = function(rect) {
    this.root_node.remove(rect);
};


/**
 * Finds all rectangles overlapping a test rectangle.
 *
 * @param rect
 * @returns {Array}
 */
cs.BinSpaceTree.prototype.findOverlapping = function(rect) {
    var overlapping = this.root_node.findOverlapping(rect);
    return overlapping;
};


/**
 * Finds all potentially overlapping rectangles.
 *
 * @param rect
 * @returns {Array}
 */
cs.BinSpaceTree.prototype.findPotentialOverlapping = function(rect) {
    var overlapping = this.root_node.findPotentialOverlapping(rect);
    return overlapping;
};


/**
 * Draws all the tree's nodes and rectangles onto an HTML canvas' 2D context.
 *
 * @param ctx
 */
cs.BinSpaceTree.prototype.debugDraw = function(ctx) {
    this.root_node.debugDraw(ctx);
};

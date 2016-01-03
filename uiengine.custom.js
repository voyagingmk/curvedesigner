
(function(pkg, Class) {

eval(zebra.Import("ui", "layout", "util"));

pkg.borderColor = "#FFFFFF";
pkg.borderSize = 0;

pkg.MyGrid = Class(Panel, [
    function(option) {
        this.option = option;
        this.lineWidth = 1;
        this.color = 'black';
        this.id = "grid";
        this.$super();
        this.padding = 0;
    },
    function validate() {
        var b = this.isLayoutValid;
        this.$super();
        if (b) return;
    },
    function isInside(x, y) {
        return -1;
    },
    function paint(g) {
        g.beginPath();
        g.setColor(this.color);
        var prev = g.lineWidth;
        g.lineWidth = this.lineWidth;
        //console.log(this.width, this.height);
        g.moveTo(0,0);
        for(var y = 0; y <= this.height; y += this.option.margin) {
            g.moveTo(0,y);
            g.lineTo(this.width, y);
        }
        for(var x = 0; x <= this.width; x += this.option.margin) {
            g.moveTo(x,0);
            g.lineTo(x,this.height);
        }
        g.stroke();
        g.lineWidth = prev;
    }
]);

pkg.MySimplePoint = Class(Panel, [
    function(x,y,col) {
        this.px = x;
        this.py = y;
        this.pw = 4;
        this.ph = 4;
        this.color = col;
        this.$super();
        this.setPadding(8);
    },
    function validate() {
        var b = this.isLayoutValid;
        this.$super();
        if (b) return;
    },
    function isInside(x, y) {
       if ((this.py - y) * (this.py - y) + (this.px - x) * (this.px - x) < 4 * this.lineWidth * this.lineWidth) {
            return 1;
        }
        return -1;
    },

    function setHighlight(b) {
        this.highlight = b;
        this.repaint();
    },

    function paint(g) {        
        g.setColor(this.color);
        g.fillRect(this.px-this.pw*0.5, this.py-this.ph*0.5,this.pw,this.ph);
    }
]);


pkg.BSpline = Class(Panel, [
    function(cpoints, order, t1, t2, dt, col) {
        this.cpoints = cpoints;
        this.order = order;
        this.t1 = t1;
        this.t2 = t2;
        this.dt = dt;
        this.color = col;
        this.lineWidth = 4;
        this.$super();
        this.setPadding(0);
        this.refreshSpline();
        this.id='BSpline';
    },

    function refreshSpline(cpoints) {
        if(cpoints)
            this.cpoints = cpoints;
        var left = this.getLeft() + this.lineWidth, top = this.getTop() + this.lineWidth;
        this.gx = [ left ];
        this.gy = [ top ];
        if(this.cpoints.length<3)
            return;
        for(var t = this.t1, i = 1; t <= this.t2; t += this.dt, i++) {
            var point = bspline(t, this.order, this.cpoints);
           // console.log(point);
            this.gx[i] = left + point[0]*400;
            this.gy[i] = top + point[1]*400;
        }
       // console.log(this.gx, this.gy);
    },

    function isInside(x, y) {
        for(var i = 1; i < this.gx.length; i++) {
            var rx = this.gx[i], ry = this.gy[i];
            if ((ry - y) * (ry - y) + (rx - x) * (rx - x) < 4 * this.lineWidth * this.lineWidth) {
                return i;
            }
        }
        return -1;
    },
    function setHighlight(b) {
        this.highlight = b;
        this.repaint();
    },

    function paint(g) {
        if(this.cpoints.length < 3)
            return;
        g.beginPath();
        g.setColor(this.color);
        var prev = g.lineWidth;
        g.lineWidth = this.lineWidth;
        g.moveTo(this.gx[1], this.gy[1]);
        for(var i = 2; i < this.gx.length; i++) {
            g.lineTo(this.gx[i], this.gy[i]);
        }
        g.stroke();

        if (this.highlight) {
            g.lineWidth = this.lineWidth*3;
            g.beginPath();
            g.setColor("rgba(255,10,10, 0.3)");
            g.moveTo(this.gx[1], this.gy[1]);
            for(var i = 1; i < this.gx.length; i++) {
                g.lineTo(this.gx[i], this.gy[i]);
            }
            g.stroke();
        }

        g.lineWidth = prev;
    }
]);

pkg.MySimpleChart = Class(Panel, [
    function(f, x1, x2, dx, col) {
        this.f = f;
        this.x1 = x1;
        this.x2 = x2;
        this.dx = dx;
        this.color = col;
        this.lineWidth = 4;
        this.$super();
        this.setPadding(8);
    },

    function validate() {
        //console.log('validate')
        var b = this.isLayoutValid;
        this.$super();
        if (b) return;

        var maxy = -1000000, miny = 1000000, fy = [];
        for(var x = this.x1, i = 0; x < this.x2; x += this.dx, i++) {
            fy[i] = this.f(x);
            if (fy[i] > maxy) maxy = fy[i];
            if (fy[i] < miny) miny = fy[i];
        }

        var left = this.getLeft() + this.lineWidth, top = this.getTop() + this.lineWidth,
            ww = this.width  - left - this.getRight()  - this.lineWidth*2,
            hh = this.height - top  - this.getBottom() - this.lineWidth*2,
            cx  = ww/(this.x2 - this.x1), cy = hh/ (maxy - miny);

        var t = function (xy, ct) {
            return ct * xy;
        };

        this.gx = [ left ];
        this.gy = [ top + t(fy[0] - miny, cy) ];
        for(var x = this.x1 + this.dx, i = 1; i < fy.length; x += this.dx, i++) {
            this.gx[i] = left + t(x - this.x1, cx);
            this.gy[i] = top  + t(fy[i] - miny, cy);
        }
    },

    function isInside(x, y) {
        for(var i = 0; i < this.gx.length; i++) {
            var rx = this.gx[i], ry = this.gy[i];
            if ((ry - y) * (ry - y) + (rx - x) * (rx - x) < 4 * this.lineWidth * this.lineWidth) {
                return i;
            }
        }
        return -1;
    },

    function setHighlight(b) {
        this.highlight = b;
        this.repaint();
    },

    function paint(g) {
        console.log("chart paint")
        g.beginPath();
        g.setColor(this.color);
        var prev = g.lineWidth;
        g.lineWidth = this.lineWidth;
        //console.log(this.gx[0],this.gy[0]);
        g.moveTo(this.gx[0], this.gy[0]);
        for(var i = 1; i < this.gx.length; i++) {
            g.lineTo(this.gx[i], this.gy[i]);
        }
        g.stroke();

        if (this.highlight) {
            g.lineWidth = this.lineWidth*3;
            g.beginPath();
            g.setColor("rgba(255,10,10, 0.3)");
            g.moveTo(this.gx[0], this.gy[0]);
            for(var i = 1; i < this.gx.length; i++) {
                g.lineTo(this.gx[i], this.gy[i]);
            }
            g.stroke();
        }

        g.lineWidth = prev;
    }
]);

pkg.MyPan = Class(Panel, [
    function() {
        this.$super();
        this.setPadding(0);
    },

    function activated(b) {}
]);

pkg.createBorderPan = function (txt, content, w, h) {
    content = content || new Panel();
    var bp = new BorderPan(txt, content);
    content.setPadding(4);
    w = w || -1;
    h = h || -1;
    bp.setPreferredSize(w, h);
    return bp;
};

pkg.MyDrawBoard = new Class(ViewPan, [
function() {
    this.$super();
    this.setLayout(new zebra.layout.StackLayout());
    this.height = 400;
    this.padding = 8;
    this.id = 'DrawBoard';
    this.background = "white"; 
    this.add(CENTER, new pkg.BSpline([],3,0,1,0.01,"#33ddCC"));
        //new MySimpleChart(function(x) { return Math.sin(x); }, -3, 3, 0.01, "#11FF99"),
        //new MySimpleChart(function(x) { return Math.cos(x)*Math.sin(x) - 2 * Math.sin(x*x); }, -2, 3, 0.01, "#CCFF77"),
    this.add(CENTER, new pkg.MyGrid({
            margin:20,
        }));
    var self = this;
    self.m_Points = [];
    this.add(CENTER, new Panel([
        function mouseReleased(e){
            if(!this.selected){
                var pointObj = new pkg.MySimplePoint(e.x,e.y, "#ff0000");
                self.insert(0, CENTER, pointObj);
                self.m_Points.push(pointObj);
                var cpoints = [];
                for(var i = 0; i < self.m_Points.length;i++){
                    var p = self.m_Points[i];
                    cpoints.push([p.px/400,p.py/400]); 
                }
                g_DrawBoard.find("//zebra.ui.Panel[@id='BSpline']").refreshSpline(cpoints);
            }
            return true;
        },
        function mouseMoved(e) {
            this.checkSelect(e);
            return true;
        },
        function checkSelect(e){
            for(var i=0; i<this.parent.kids.length-1; i++) {
                var kid = this.parent.kids[i];
                    j   = kid.isInside(e.x, e.y);
                
                if (j >= 0) {
                    kid.setHighlight(true);
                    this.selected = kid;
                    this.index = j;
                    break;
                }
                else {
                    this.selected = null;
                    if (kid.highlight) kid.setHighlight(false);     
                }
            }
        },
        function mouseDragStarted(e) {
            this.checkSelect(e);
            this.dx = e.x;
            this.dy = e.y;
        },

        function mouseDragged(e) {
            if (this.selected) {
                for (var i=0; i < this.selected.gx.length; i++) {
                    this.selected.gx[i] += (e.x - this.dx); 
                    this.selected.gy[i] += (e.y - this.dy); 
                }
                this.selected.repaint();
            }
            this.dx = e.x;
            this.dy = e.y;
        }
    ]));
},
function cleanControlPoints(){
    for(var i =0; i < this.m_Points.length;i++){
        var p = this.m_Points[i];
        this.remove(p);
    }
    this.m_Points = [];
}]);

pkg.MyLayout = new Class(pkg.MyPan, [
    function() {
        this.$super();
        this.setLayout(new BorderLayout());
        this.add(CENTER, this.borderLayoutPage());
        this.add(BOTTOM, this.createTextFieldPan());
        var ch = new Checkbox("grid");
        ch.setValue(true);
        this.add(BOTTOM, ch);
        ch.manager.bind(function(t) {
            g_DrawRoot.find("//zebra.ui.Panel[@id='grid']").setVisible(t.state);
        });
    },
    function borderLayoutPage() {
        var bl_p = new Panel(new BorderLayout(2,2));
        bl_p.setPadding(4);
        var btn = new Button("Clean Control Points");
        bl_p.add(TOP, btn);
        btn.bind(function() {
            g_DrawBoard.cleanControlPoints();
        });
        bl_p.add(BOTTOM, new Button("BOTTOM"));
        bl_p.add(RIGHT, new Button("RIGHT"));
        bl_p.add(LEFT, new Button("LEFT"));
        bl_p.add(CENTER, new Button("CENTER"));
        return bl_p;
    },
    function createTextFieldPan() {
        var p = new Panel(new GridLayout(3, 2));
         var ctr = new Constraints();
        ctr.ay = CENTER;
        ctr.setPadding(2);
        
        var tf = new TextField(new zebra.data.SingleLineTxt("3", 1),[
            function keyTyped(e) { 
                this.$super(e);
                if(e.code < 49 || e.code > 57){
                    this.setValue('3');
                }
            }
        ]);
        tf.setPreferredSize(150, -1);
        tf.setHint(":enter order");

        p.add(ctr, new BoldLabel("Order:"));
        p.add(ctr, tf);

/*
        tf = new TextField(new zebra.data.SingleLineTxt("dsd", 5));
        tf.setPreferredSize(150, -1);
        p.add(ctr, new BoldLabel("Fixed size(5):"));
        p.add(ctr, tf);

        tf = new TextField(new PasswordText());
        tf.setPreferredSize(150, -1);
        p.add(ctr, new BoldLabel("Password field:"));
        p.add(ctr, tf);
*/
        return pkg.createBorderPan("Parameters", p);
    }
]);

})(zebra("ui.custom"), zebra.Class);
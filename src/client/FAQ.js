import React, { useEffect, useState } from "react";
import Faq from "react-faq-component";

export default function FAQPanel() {
    const [rows, setRowsOption] = useState(null);

    const data = {
    rows: [
        {
            title: "How do I add a seam?",
            content: `Click and drag within the boundary of the block.`,
        },
        {
            title: "How do I save a design?",
            content: `Click on file in the upper left and then either download SVG or download PDF.`,
        },
        {
            title: "How do I move a seam?",
            content: `You will need to erase the seam and then draw the intended one.`,
        },
        {
            title: "My design just disappeared when I reloaded the page. Can I get it back?",
            content: `Probably not -- sorry! Please make sure to save your design frequently.`,
        },
        {
            title: "I can't see the full block. How do I fix this?",
            content: `If you can't see the full design area, we recommend zooming out in your Browser (i.e., view -> zoom in/out in Chrome) `,
        },
        {
            title: "Why can't seams intersect and pass through each other?",
            content: `Unfortunately due to the way we designed the tool, you will need to draw two separate seams that meet at a
            vertex to draw two seams that cross in an X-configuration.`,
        },
        {
            title: "I see my design is not paper pieceable in a single section. What should I do?",
            content: `You have some different choices depending on the design you would like to draw. You could
            erase seam(s), extend an existing seam to the boundary, or introduce a section boundary.`,
        },
        {
            title: "Do you have any tips for sewing my design?",
            content: <div> 
            <p>There are many wonderful resources online for learning to sew using foundation paper piecing. We have listed
            a few of our favorites in our <a href="https://docs.google.com/document/d/101sPjTxzTI_ju9H0mVZ6SgoXHIS3I1gv5srckECIeIg/edit?usp=sharing" target="_blank">tutorial</a>.</p>
            </div>,
        },
        {
            title: "Is this tool really free?",
            content: `Yes! This tool is a research project that appeared at SIGGRAPH'21. It is a standalone tool that we
            hope the quilting community will use. We'd love to see what you make with it.`,
        },
        {
            title: "How does your tool figure out a sewing order?",
            content: `We construct what is called a hypergraph for a design and use a process called hypergraph peeling to determine
            if a design is paper pieceable, and if so what a sewing order would be. For more detailed information, please see our paper and videos
                at our main site (http://web.stanford.edu/~mleake/projects/paperpiecing/)`,
        },
        {
            title: "I am noticing unexpected behavior in the tool. Can you please help?",
            content: `Hopefully! Please describe the issue and take a screenshot if applicable and send an email to fppresearch2021@gmail.com.`,
        },
        {
            title: "I made something really cool. Can I show you?",
            content: `Yes, please! We'd love to see what you made. Please send photos to fppresearch2021@gmail.com.`,
        },
        {
            title: "Where can I find additional help or make suggestions?",
            content: `Please reach out to fppresearch2021@gmail.com with comments and suggestions. We have a small team of students working on this research project.
            We would love to hear from you, but please keep in mind that we may not be able to make all suggested changes.`
        },
    ],
      
    };

    const styles = {
    // bgColor: 'white',
    titleTextColor: 'black',
    // titleTextSize: '48px',
    rowTitleColor: 'black',
    // rowTitleTextSize: 'medium',
    // rowContentColor: 'grey',
    rowContentTextSize: '16px',
    // rowContentPaddingTop: '10px',
    rowContentPaddingBottom: '10px',
    rowContentPaddingLeft: '50px',
    // rowContentPaddingRight: '150px',
    // arrowColor: "red",
    //transitionDuration: "1s",
    // timingFunc: "ease"
  };


    useEffect(() => {
        if (rows) {
            setTimeout(() => {
                rows[0].expand();
            }, 2500);

            setTimeout(() => {
                rows[0].close();
            }, 5000);

            setTimeout(() => {
                rows[0].scrollIntoView();
                // rows[0].scrollIntoView(true);
            }, 10000);
        }
    }, [rows]);

    return (
        <div>
            <div className="faq-style-wrapper">
                <Faq data={data}  styles={styles} getRowOptions={setRowsOption} />
            </div>
        </div>
    );
}
// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.

function toggleMenu() {
               
    var x = document.getElementById("sidebar");
    var b = document.getElementById("blackout");
    
    const sidebarHeader = document.getElementById("sidebar-header");
    const sidebarHeaderSeparator = document.getElementById("sidebar-header-separator");

    if (x.style.left === "0px") 
    {
        x.style.left = "calc(var(--sidebar-width) * -1)";
        b.classList.remove("showThat");
        b.classList.add("hideThat");
        
        sidebarHeader.classList.remove("hide");
        sidebarHeaderSeparator.classList.remove("hide");
    } 
    else 
    {
        x.style.left = "0px";
        b.classList.remove("hideThat");
        b.classList.add("showThat");
        
        sidebarHeader.classList.add("hide");
        sidebarHeaderSeparator.classList.add("hide");
    }
}
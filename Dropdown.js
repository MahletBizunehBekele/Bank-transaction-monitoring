import React from 'react'

function Dropdown(){
    return(
        <div className='flex flex-col'>
            <div className='flex flex-col gap-4'>
                <li>Profile</li>
                <li>Change-Password</li>
                <li>Logout</li>
            </div>
        </div>
    );
}

export default Dropdown;
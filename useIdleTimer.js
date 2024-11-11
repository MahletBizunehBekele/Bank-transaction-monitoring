import  {useState, useEffect} from 'react';

const useIdleTimer = (timeout, onTimeout) =>{
    useEffect(() =>{
        const handleActivity = () => {
            if(timer) clearTimeout(timer);
            timer = setTimeout(onTimeout, timeout);
        };
   

    let timer = setTimeout(onTimeout, timeout);

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return() => {
        clearTimeout(timer);
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);
    };
    },[timeout, onTimeout]);
};

export default useIdleTimer;
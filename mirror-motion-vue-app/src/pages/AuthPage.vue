<template>
    <div class="auth-container">
        <div class="auth-box">
            <h2>{{ isLogin ? 'Login' : 'Sign Up' }}</h2>

            <div class="input-group">
                <input v-model="username" type="text" placeholder="Username" @keyup.enter="handleSubmit">
            </div>

            <div class="input-group">
                <input v-model="password" type="password" placeholder="Password" @keyup.enter="handleSubmit">
            </div>

            <div class="button-group">
                <button @click="handleSubmit" class="submit-btn">
                    {{ isLogin ? 'Login' : 'Sign Up' }}
                </button>
                <button @click="toggleMode" class="toggle-btn">
                    {{ isLogin ? 'Need an account?' : 'Already have an account?' }}
                </button>
            </div>

            <div class="message" :class="{ error: isError }">
                {{ message }}
            </div>
        </div>
    </div>
</template>

<script>
import { userService } from '@/services/userService';

export default {
    name: 'AuthPage',
    data() {
        return {
            username: '',
            password: '',
            isLogin: true,
            message: '',
            isError: false
        };
    },
    methods: {
        async handleSubmit() {
            try {
                this.message = '';
                this.isError = false;

                if (!this.username || !this.password) {
                    this.message = 'Please fill in all fields.';
                    this.isError = true;
                    return;
                }

                const result = await (this.isLogin ?
                    userService.login(this.username, this.password) :
                    userService.register(this.username, this.password)
                );

                this.message = this.isLogin ? 'Login successful!' : 'Registration successful!';

                // Check if just logging in or registering
                // If logging in, store the session ID and redirect to video library
                // else just redirect to login
                if (this.isLogin) {
                    localStorage.setItem('session', result.session);
                    this.$router.push('/videoLibrary');
                }
                else {
                    setTimeout(() => {
                        this.message = '';
                        this.isLogin = true;
                    }, 500);
                }
            } catch (error) {
                if (this.isLogin) {
                    this.message = 'Could not find account';
                } else {
                    this.message = 'Registration failed. Username may already be taken.';
                }
                this.isError = true;
            }
        },
        toggleMode() {
            this.isLogin = !this.isLogin;
            this.message = '';
            this.isError = false;
        }
    }
};
</script>

<style scoped>
.auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.auth-box {
    padding: 2rem;
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

h2 {
    color: #3abdf8;
    text-align: center;
    margin-bottom: 2rem;
    font-size: 38px;
}

.input-group {
    margin-bottom: 1rem;
    width: 100%;
    max-width: 300px
}

input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1rem;
    transition: border-color 0.3s;
}


input:focus,
input:hover {
    outline: none;
    border-color: #3abdf8;
}

.button-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
}

button {
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
}

.submit-btn {
    background-color: #7dc7e9;
    color: white;
    width: 30%;
}

.submit-btn:hover {
    background-color: #3abdf8;
}

.toggle-btn {
    background-color: transparent;
    color: #aed3e4;
}

.toggle-btn:hover {
    color: #3abdf8;
}

.message {
    margin-top: 1rem;
    text-align: center;
    color: #4caf50;
    font-size: 0.9rem;
}

.message.error {
    color: #f44336;
}
</style>
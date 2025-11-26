import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface OnboardingSlide {
  title: string;
  description: string;
  icon: string;
  gradient: string;
}

@Component({
  selector: 'app-splash',
  imports: [CommonModule],
  templateUrl: './splash.html',
  styleUrl: './splash.scss',
})
export class Splash implements OnInit {
  currentSlide = 0;
  isAnimating = false;

  slides: OnboardingSlide[] = [
    {
      title: 'Welcome to Swift Wallet',
      description: 'Your smart digital wallet for seamless money management',
      icon: '💳',
      gradient: 'primary'
    },
    {
      title: 'Send Money Instantly',
      description: 'Transfer funds to anyone, anywhere in seconds with just their phone number',
      icon: '⚡',
      gradient: 'secondary'
    },
    {
      title: 'AI-Powered Support',
      description: 'Get instant help from our intelligent chatbot available 24/7',
      icon: '🤖',
      gradient: 'accent'
    },
    {
      title: 'Track Your Spending',
      description: 'Real-time analytics and insights to help you manage your finances',
      icon: '📊',
      gradient: 'vibrant'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Auto-advance slides every 3 seconds
    setInterval(() => {
      if (this.currentSlide < this.slides.length - 1) {
        this.nextSlide();
      }
    }, 3000);
  }

  nextSlide(): void {
    if (this.currentSlide < this.slides.length - 1 && !this.isAnimating) {
      this.isAnimating = true;
      this.currentSlide++;
      setTimeout(() => this.isAnimating = false, 300);
    }
  }

  previousSlide(): void {
    if (this.currentSlide > 0 && !this.isAnimating) {
      this.isAnimating = true;
      this.currentSlide--;
      setTimeout(() => this.isAnimating = false, 300);
    }
  }

  goToSlide(index: number): void {
    if (!this.isAnimating && index !== this.currentSlide) {
      this.isAnimating = true;
      this.currentSlide = index;
      setTimeout(() => this.isAnimating = false, 300);
    }
  }

  skip(): void {
    this.router.navigate(['/auth/login']);
  }

  getStarted(): void {
    this.router.navigate(['/auth/register']);
  }

  isLastSlide(): boolean {
    return this.currentSlide === this.slides.length - 1;
  }
}

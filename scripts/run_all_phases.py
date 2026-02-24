"""
运行所有Phase的主脚本
Run All Phases Script

一键执行Phase 1-6的完整流程
"""

import subprocess
import sys
from loguru import logger


def run_phase(phase_num: int, script_name: str) -> bool:
    """运行单个Phase"""
    logger.info(f"\n{'='*60}")
    logger.info(f"Running Phase {phase_num}: {script_name}")
    logger.info(f"{'='*60}\n")
    
    try:
        result = subprocess.run(
            [sys.executable, f'scripts/{script_name}'],
            capture_output=False,
            text=True
        )
        
        if result.returncode == 0:
            logger.info(f"✅ Phase {phase_num} completed successfully")
            return True
        else:
            logger.error(f"❌ Phase {phase_num} failed with return code {result.returncode}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Phase {phase_num} error: {e}")
        return False


def main():
    """运行所有Phase"""
    logger.info("=" * 60)
    logger.info("JiuCai AI - Complete Pipeline Execution")
    logger.info("Running Phase 1-6")
    logger.info("=" * 60)
    
    phases = [
        (1, 'phase1_infrastructure_setup.py'),
        (2, 'phase2_data_preparation.py'),
        (3, 'phase3_model_training.py'),
        (4, 'phase4_reinforcement_learning.py'),
        (5, 'phase5_system_integration.py'),
        (6, 'phase6_paper_preparation.py')
    ]
    
    completed_phases = []
    
    for phase_num, script_name in phases:
        if run_phase(phase_num, script_name):
            completed_phases.append(phase_num)
        else:
            logger.error(f"Stopping at Phase {phase_num} due to failure")
            break
    
    # 最终总结
    logger.info("\n" + "=" * 60)
    logger.info("Pipeline Execution Summary")
    logger.info("=" * 60)
    logger.info(f"Completed Phases: {len(completed_phases)}/6")
    
    for phase_num in completed_phases:
        logger.info(f"✅ Phase {phase_num}")
    
    if len(completed_phases) == 6:
        logger.info("\n🎉 All phases completed successfully! 🎉")
        logger.info("\nProject outputs:")
        logger.info("- data/ - Processed data")
        logger.info("- outputs/ - Models and results")
        logger.info("- paper/ - Paper templates")
        logger.info("- docs/ - Documentation")
        return True
    else:
        logger.warning(f"\n⚠️ Only {len(completed_phases)}/6 phases completed")
        logger.info("Please check logs and re-run failed phases")
        return False


if __name__ == "__main__":
    result = main()
    sys.exit(0 if result else 1)

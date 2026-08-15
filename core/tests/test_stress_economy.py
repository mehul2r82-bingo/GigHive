from django.test import TestCase
from core.services.stress_simulator import StressSimulator, SimulationConfig

class StressEconomyTests(TestCase):

    def test_smoke(self):
        sim = StressSimulator(SimulationConfig())
        result = sim.run(cleanup=True)

        self.assertTrue(
            result.is_healthy,
            f"Invariant violations: {result.violations}",
        )



    

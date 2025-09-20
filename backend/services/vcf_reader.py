# services/vcf_reader.py
from cyvcf2 import VCF
from collections import namedtuple

Variant = namedtuple("Variant", ["chrom", "pos", "ref", "alt", "rsid"])

def stream_variants(vcf_path, max_records=None):
    """Yield Variant tuples from a .vcf(.gz) file."""
    for i, record in enumerate(VCF(vcf_path)):
        if max_records and i >= max_records:
            break
        rsid = record.ID  # may be '.'
        for alt in record.ALT:                # multiallelic handled
            yield Variant(record.CHROM, record.POS, record.REF, alt, rsid)
